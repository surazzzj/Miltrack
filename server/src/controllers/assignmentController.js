const { Assignment, Equipment, Base } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      baseId,
      equipmentId,
      personnelName,
      status,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    const effectiveBaseId = req.baseScope || baseId;
    if (effectiveBaseId) query.baseId = effectiveBaseId;
    if (equipmentId) query.equipmentId = equipmentId;
    if (status) query.status = status;

    if (personnelName) {
      query.personnelName = { $regex: personnelName, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.assignmentDate = {};
      if (dateFrom) query.assignmentDate.$gte = new Date(dateFrom);
      if (dateTo) query.assignmentDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { assignmentNumber: { $regex: search, $options: 'i' } },
        { personnelName: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Assignment.find(query)
        .populate('baseId', 'name code location')
        .populate('equipmentId', 'name type code unitOfMeasure')
        .populate('assignedBy', 'fullName email rank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Assignment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assignments/:id
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('baseId')
      .populate('equipmentId')
      .populate('assignedBy', 'fullName email rank');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/assignments
 */
const createAssignment = async (req, res, next) => {
  try {
    const {
      baseId,
      equipmentId,
      assetCode,
      personnelName,
      personnelId,
      quantity,
      assignmentDate,
      purpose,
      notes,
    } = req.body;

    const targetBaseId = req.baseScope || baseId;

    // Verify equipment
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Specified equipment not found.',
      });
    }

    // Validate available inventory: requested <= available
    const stockStatus = await inventoryService.validateStockAvailability(
      targetBaseId,
      equipmentId,
      quantity
    );

    if (!stockStatus.hasSufficientStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available inventory for assignment. Requested: ${quantity}, Available: ${stockStatus.available}.`,
      });
    }

    const count = await Assignment.countDocuments();
    const assignmentNumber = `ASG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const assignment = new Assignment({
      assignmentNumber,
      baseId: targetBaseId,
      equipmentId,
      assetCode,
      personnelName,
      personnelId,
      quantity,
      assignmentDate: assignmentDate ? new Date(assignmentDate) : new Date(),
      purpose,
      status: 'ACTIVE',
      assignedBy: req.user._id,
      notes,
    });

    const saved = await assignment.save();

    await auditService.log({
      req,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'Assignment',
      entityId: saved._id,
      baseId: targetBaseId,
      after: saved,
      notes: `Assigned ${quantity}x ${equipment.name} to ${personnelName}`,
    });

    const populated = await Assignment.findById(saved._id)
      .populate('baseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('assignedBy', 'fullName rank');

    res.status(201).json({
      success: true,
      message: 'Asset assigned successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/assignments/:id
 */
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    const beforeState = assignment.toObject();
    const { status, returnedAt, notes } = req.body;

    if (status !== undefined) {
      assignment.status = status;
      if (status === 'RETURNED' && !assignment.returnedAt) {
        assignment.returnedAt = returnedAt ? new Date(returnedAt) : new Date();
      }
    }

    if (notes !== undefined) assignment.notes = notes;

    const saved = await assignment.save();

    await auditService.log({
      req,
      action: status === 'RETURNED' ? 'ASSIGNMENT_RETURNED' : 'ASSIGNMENT_UPDATED',
      entityType: 'Assignment',
      entityId: assignment._id,
      baseId: assignment.baseId,
      before: beforeState,
      after: saved.toObject(),
      notes: `Assignment ${assignment.assignmentNumber} status updated to ${assignment.status}`,
    });

    const populated = await Assignment.findById(saved._id)
      .populate('baseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('assignedBy', 'fullName rank');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/assignments/:id
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    const beforeState = assignment.toObject();
    await assignment.deleteOne();

    await auditService.log({
      req,
      action: 'ASSIGNMENT_DELETED',
      entityType: 'Assignment',
      entityId: assignment._id,
      baseId: assignment.baseId,
      before: beforeState,
      notes: `Assignment ${assignment.assignmentNumber} removed`,
    });

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
