const { Equipment, Base, Purchase, Transfer, Assignment, Expenditure } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/equipment
 */
const getEquipment = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      baseId,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const query = { isActive: true };

    if (type && type !== 'ALL') query.type = type;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const effectiveBaseId = req.baseScope || baseId;

    const [equipmentList, total] = await Promise.all([
      Equipment.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Equipment.countDocuments(query),
    ]);

    // Attach real-time inventory calculations to each equipment item
    const itemsWithStock = await Promise.all(
      equipmentList.map(async (eq) => {
        let status;
        if (effectiveBaseId) {
          status = await inventoryService.getInventoryStatus(effectiveBaseId, eq._id);
        } else {
          // Network-wide rollup
          const bases = await Base.find({ isActive: true }).select('_id');
          let totalPhysical = 0;
          let totalAssigned = 0;
          for (const b of bases) {
            const bStatus = await inventoryService.getInventoryStatus(b._id, eq._id);
            totalPhysical += bStatus.closingBalance;
            totalAssigned += bStatus.assigned;
          }
          status = {
            closingBalance: totalPhysical,
            assigned: totalAssigned,
            available: Math.max(0, totalPhysical - totalAssigned),
          };
        }

        return {
          ...eq,
          stock: {
            total: status.closingBalance,
            assigned: status.assigned,
            available: status.available,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      items: itemsWithStock,
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
 * GET /api/equipment/:id
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found in registry.',
      });
    }

    const effectiveBaseId = req.baseScope || req.query.baseId;

    // Stock per base
    const bases = await Base.find({ isActive: true }).lean();
    const stockPerBase = await Promise.all(
      bases.map(async (b) => {
        const status = await inventoryService.getInventoryStatus(b._id, equipment._id);
        return {
          baseId: b._id,
          name: b.name,
          code: b.code,
          total: status.closingBalance,
          assigned: status.assigned,
          available: status.available,
        };
      })
    );

    // Histories
    const baseFilter = effectiveBaseId ? { baseId: effectiveBaseId } : {};

    const [purchases, transfers, assignments, expenditures] = await Promise.all([
      Purchase.find({ equipmentId: equipment._id, ...baseFilter })
        .populate('baseId', 'name code')
        .populate('createdBy', 'fullName rank')
        .sort({ purchaseDate: -1 })
        .limit(10)
        .lean(),
      Transfer.find({
        equipmentId: equipment._id,
        ...(effectiveBaseId
          ? { $or: [{ fromBaseId: effectiveBaseId }, { toBaseId: effectiveBaseId }] }
          : {}),
      })
        .populate('fromBaseId', 'name code')
        .populate('toBaseId', 'name code')
        .populate('initiatedBy', 'fullName rank')
        .sort({ transferDate: -1 })
        .limit(10)
        .lean(),
      Assignment.find({ equipmentId: equipment._id, ...baseFilter })
        .populate('baseId', 'name code')
        .populate('assignedBy', 'fullName rank')
        .sort({ assignmentDate: -1 })
        .limit(10)
        .lean(),
      Expenditure.find({ equipmentId: equipment._id, ...baseFilter })
        .populate('baseId', 'name code')
        .populate('recordedBy', 'fullName rank')
        .sort({ date: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalStock = stockPerBase.reduce((sum, b) => sum + b.total, 0);
    const totalAssigned = stockPerBase.reduce((sum, b) => sum + b.assigned, 0);

    res.status(200).json({
      success: true,
      data: {
        ...equipment.toObject(),
        stock: {
          total: totalStock,
          assigned: totalAssigned,
          available: Math.max(0, totalStock - totalAssigned),
          bases: stockPerBase,
        },
        history: {
          purchases,
          transfers,
          assignments,
          expenditures,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/equipment
 */
const createEquipment = async (req, res, next) => {
  try {
    const { name, type, code, description, isSerialized, unitOfMeasure, standardCost } = req.body;

    const existing = await Equipment.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Equipment with code/NSN ${code.toUpperCase()} already exists.`,
      });
    }

    const equipment = new Equipment({
      name,
      type,
      code: code.toUpperCase(),
      description,
      isSerialized,
      unitOfMeasure: unitOfMeasure || 'units',
      standardCost: standardCost || 0,
    });

    const saved = await equipment.save();

    await auditService.log({
      req,
      action: 'EQUIPMENT_CREATED',
      entityType: 'Equipment',
      entityId: saved._id,
      after: saved,
      notes: `Cataloged new equipment item: ${name} (${code})`,
    });

    res.status(201).json({
      success: true,
      message: 'Equipment cataloged successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/equipment/:id
 */
const updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    const beforeState = equipment.toObject();
    const { name, type, description, isSerialized, unitOfMeasure, standardCost } = req.body;

    if (name) equipment.name = name;
    if (type) equipment.type = type;
    if (description !== undefined) equipment.description = description;
    if (isSerialized !== undefined) equipment.isSerialized = isSerialized;
    if (unitOfMeasure) equipment.unitOfMeasure = unitOfMeasure;
    if (standardCost !== undefined) equipment.standardCost = standardCost;

    const saved = await equipment.save();

    await auditService.log({
      req,
      action: 'EQUIPMENT_UPDATED',
      entityType: 'Equipment',
      entityId: saved._id,
      before: beforeState,
      after: saved.toObject(),
      notes: `Equipment ${equipment.code} updated`,
    });

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
};
