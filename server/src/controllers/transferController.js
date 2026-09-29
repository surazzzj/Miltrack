const mongoose = require('mongoose');
const { Transfer, Equipment, Base, InventoryTransaction } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/transfers
 */
const getTransfers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      fromBaseId,
      toBaseId,
      baseId,
      equipmentId,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Base scoping
    const effectiveBaseId = req.baseScope || baseId;
    if (effectiveBaseId) {
      query.$or = [{ fromBaseId: effectiveBaseId }, { toBaseId: effectiveBaseId }];
    } else {
      if (fromBaseId) query.fromBaseId = fromBaseId;
      if (toBaseId) query.toBaseId = toBaseId;
    }

    if (equipmentId) query.equipmentId = equipmentId;
    if (status) query.status = status;

    if (dateFrom || dateTo) {
      query.transferDate = {};
      if (dateFrom) query.transferDate.$gte = new Date(dateFrom);
      if (dateTo) query.transferDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        ...(query.$or || []),
        { transferNumber: { $regex: search, $options: 'i' } },
        { assetDescription: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Transfer.find(query)
        .populate('fromBaseId', 'name code location')
        .populate('toBaseId', 'name code location')
        .populate('equipmentId', 'name type code unitOfMeasure')
        .populate('initiatedBy', 'fullName email rank')
        .populate('approvedBy', 'fullName email rank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transfer.countDocuments(query),
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
 * GET /api/transfers/:id
 */
const getTransferById = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromBaseId')
      .populate('toBaseId')
      .populate('equipmentId')
      .populate('initiatedBy', 'fullName rank email')
      .populate('approvedBy', 'fullName rank email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer manifest not found.',
      });
    }

    if (
      req.baseScope &&
      transfer.fromBaseId._id.toString() !== req.baseScope &&
      transfer.toBaseId._id.toString() !== req.baseScope
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to your base installation.',
      });
    }

    res.status(200).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/transfers
 */
const createTransfer = async (req, res, next) => {
  try {
    const {
      fromBaseId,
      toBaseId,
      equipmentId,
      assetDescription,
      assetCode,
      quantity,
      transferDate,
      expectedArrival,
      reason,
      notes,
      status = 'PENDING',
    } = req.body;

    const sourceBaseId = req.baseScope || fromBaseId;

    if (sourceBaseId.toString() === toBaseId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Origin base and destination base cannot be identical.',
      });
    }

    // Verify equipment exists
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Specified equipment does not exist in registry.',
      });
    }

    // Validate stock availability at source base
    const stockStatus = await inventoryService.validateStockAvailability(
      sourceBaseId,
      equipmentId,
      quantity
    );

    if (!stockStatus.hasSufficientStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available stock at origin installation. Requested: ${quantity}, Available: ${stockStatus.available}.`,
      });
    }

    const count = await Transfer.countDocuments();
    const transferNumber = `TR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const transfer = new Transfer({
      transferNumber,
      fromBaseId: sourceBaseId,
      toBaseId,
      equipmentId,
      assetDescription: assetDescription || equipment.name,
      assetCode,
      quantity,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      expectedArrival: expectedArrival ? new Date(expectedArrival) : null,
      reason,
      notes,
      status,
      initiatedBy: req.user._id,
      inventoryApplied: false,
    });

    const savedTransfer = await transfer.save();

    await auditService.log({
      req,
      action: 'TRANSFER_CREATED',
      entityType: 'Transfer',
      entityId: savedTransfer._id,
      baseId: sourceBaseId,
      after: savedTransfer,
      notes: `Transfer manifest created for ${quantity}x ${equipment.name} from base to base`,
    });

    const populated = await Transfer.findById(savedTransfer._id)
      .populate('fromBaseId', 'name code')
      .populate('toBaseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('initiatedBy', 'fullName rank');

    res.status(201).json({
      success: true,
      message: 'Transfer manifest initiated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const { withOptionalTransaction } = require('../utils/dbUtils');

/**
 * PATCH /api/transfers/:id/status
 */
const updateTransferStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer manifest not found.',
      });
    }

    if (
      req.baseScope &&
      transfer.fromBaseId.toString() !== req.baseScope &&
      transfer.toBaseId.toString() !== req.baseScope
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted.',
      });
    }

    const beforeState = transfer.toObject();

    // Check if status is transitioning to COMPLETED
    if (status === 'COMPLETED' && !transfer.inventoryApplied) {
      // Validate source inventory availability one final time
      const stockStatus = await inventoryService.validateStockAvailability(
        transfer.fromBaseId,
        transfer.equipmentId,
        transfer.quantity
      );

      if (!stockStatus.hasSufficientStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete transfer. Insufficient available inventory at origin base. Available: ${stockStatus.available}.`,
        });
      }
    }

    const saved = await withOptionalTransaction(async (session) => {
      if (status === 'COMPLETED' && !transfer.inventoryApplied) {
        // 1. Ledger entry for TRANSFER_OUT (decreases source base)
        await inventoryService.recordTransaction(
          {
            transactionType: 'TRANSFER_OUT',
            baseId: transfer.fromBaseId,
            equipmentId: transfer.equipmentId,
            quantity: transfer.quantity,
            direction: 'OUT',
            referenceType: 'Transfer',
            referenceId: transfer._id,
            transactionDate: new Date(),
            createdBy: req.user._id,
            metadata: {
              transferNumber: transfer.transferNumber,
              toBaseId: transfer.toBaseId,
            },
          },
          session
        );

        // 2. Ledger entry for TRANSFER_IN (increases destination base)
        await inventoryService.recordTransaction(
          {
            transactionType: 'TRANSFER_IN',
            baseId: transfer.toBaseId,
            equipmentId: transfer.equipmentId,
            quantity: transfer.quantity,
            direction: 'IN',
            referenceType: 'Transfer',
            referenceId: transfer._id,
            transactionDate: new Date(),
            createdBy: req.user._id,
            metadata: {
              transferNumber: transfer.transferNumber,
              fromBaseId: transfer.fromBaseId,
            },
          },
          session
        );

        transfer.inventoryApplied = true;
        transfer.completedAt = new Date();
        transfer.approvedBy = req.user._id;
      }

      transfer.status = status;
      if (notes) transfer.notes = notes;

      return session ? transfer.save({ session }) : transfer.save();
    });

    await auditService.log({
      req,
      action: status === 'COMPLETED' ? 'TRANSFER_COMPLETED' : 'TRANSFER_STATUS_CHANGED',
      entityType: 'Transfer',
      entityId: transfer._id,
      baseId: transfer.fromBaseId,
      before: beforeState,
      after: saved.toObject(),
      notes: `Transfer ${transfer.transferNumber} status transitioned from ${beforeState.status} to ${status}`,
    });

    const populated = await Transfer.findById(saved._id)
      .populate('fromBaseId', 'name code')
      .populate('toBaseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('initiatedBy', 'fullName rank')
      .populate('approvedBy', 'fullName rank');

    res.status(200).json({
      success: true,
      message: `Transfer status updated to ${status}.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/transfers/:id
 */
const deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer manifest not found.',
      });
    }

    if (transfer.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed transfer cannot be deleted as inventory has already been settled.',
      });
    }

    const beforeState = transfer.toObject();
    await transfer.deleteOne();

    await auditService.log({
      req,
      action: 'TRANSFER_DELETED',
      entityType: 'Transfer',
      entityId: transfer._id,
      baseId: transfer.fromBaseId,
      before: beforeState,
      notes: `Transfer ${transfer.transferNumber} cancelled/deleted before execution`,
    });

    res.status(200).json({
      success: true,
      message: 'Transfer deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransferStatus,
  deleteTransfer,
};
