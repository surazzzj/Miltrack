const mongoose = require('mongoose');
const { Expenditure, Equipment, Base, InventoryTransaction } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/expenditures
 */
const getExpenditures = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      baseId,
      equipmentId,
      reason,
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
    if (reason) query.reason = { $regex: reason, $options: 'i' };

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { expenditureNumber: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
        { personnelName: { $regex: search, $options: 'i' } },
        { assetDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Expenditure.find(query)
        .populate('baseId', 'name code location')
        .populate('equipmentId', 'name type code unitOfMeasure')
        .populate('recordedBy', 'fullName email rank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expenditure.countDocuments(query),
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
 * GET /api/expenditures/:id
 */
const getExpenditureById = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id)
      .populate('baseId')
      .populate('equipmentId')
      .populate('recordedBy', 'fullName email rank');

    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure record not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: expenditure,
    });
  } catch (error) {
    next(error);
  }
};

const { withOptionalTransaction } = require('../utils/dbUtils');

/**
 * POST /api/expenditures
 */
const createExpenditure = async (req, res, next) => {
  try {
    const {
      date,
      baseId,
      equipmentId,
      assetDescription,
      quantity,
      reason,
      personnelName,
      notes,
    } = req.body;

    const targetBaseId = req.baseScope || baseId;

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
        message: `Cannot expend more than available unassigned quantity. Requested: ${quantity}, Available: ${stockStatus.available}.`,
      });
    }

    const count = await Expenditure.countDocuments();
    const expenditureNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const saved = await withOptionalTransaction(async (session) => {
      const expenditure = new Expenditure({
        expenditureNumber,
        date: date ? new Date(date) : new Date(),
        baseId: targetBaseId,
        equipmentId,
        assetDescription: assetDescription || equipment.name,
        quantity,
        reason,
        personnelName,
        notes,
        recordedBy: req.user._id,
      });

      const exp = session ? await expenditure.save({ session }) : await expenditure.save();

      // Record inventory ledger reduction (EXPENDITURE / OUT)
      await inventoryService.recordTransaction(
        {
          transactionType: 'EXPENDITURE',
          baseId: targetBaseId,
          equipmentId,
          quantity,
          direction: 'OUT',
          referenceType: 'Expenditure',
          referenceId: exp._id,
          transactionDate: exp.date,
          createdBy: req.user._id,
          metadata: {
            expenditureNumber: exp.expenditureNumber,
            reason: exp.reason,
          },
        },
        session
      );

      return exp;
    });

    await auditService.log({
      req,
      action: 'EXPENDITURE_CREATED',
      entityType: 'Expenditure',
      entityId: saved._id,
      baseId: targetBaseId,
      after: saved,
      notes: `Expended ${quantity} units of ${equipment.name} for ${reason}`,
    });

    const populated = await Expenditure.findById(saved._id)
      .populate('baseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('recordedBy', 'fullName rank');

    res.status(201).json({
      success: true,
      message: 'Expenditure recorded and inventory reduced successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/expenditures/:id
 */
const deleteExpenditure = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found.',
      });
    }

    const beforeState = expenditure.toObject();

    // Revert ledger
    await InventoryTransaction.deleteMany({
      referenceId: expenditure._id,
      referenceType: 'Expenditure',
    });

    await expenditure.deleteOne();

    await auditService.log({
      req,
      action: 'EXPENDITURE_DELETED',
      entityType: 'Expenditure',
      entityId: expenditure._id,
      baseId: expenditure.baseId,
      before: beforeState,
      notes: `Expenditure ${expenditure.expenditureNumber} reverted`,
    });

    res.status(200).json({
      success: true,
      message: 'Expenditure deleted and inventory restored.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenditures,
  getExpenditureById,
  createExpenditure,
  deleteExpenditure,
};
