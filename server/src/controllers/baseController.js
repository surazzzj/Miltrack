const { Base, Purchase, Transfer, Assignment, Expenditure, Equipment } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/bases
 */
const getBases = async (req, res, next) => {
  try {
    const query = { isActive: true };

    if (req.baseScope) {
      query._id = req.baseScope;
    }

    const bases = await Base.find(query).lean();

    const basesWithMetrics = await Promise.all(
      bases.map(async (base) => {
        const status = await inventoryService.getInventoryStatus(base._id);
        const percentOfCapacity =
          base.capacity > 0 ? Math.min(100, Math.round((status.closingBalance / base.capacity) * 100)) : 0;

        return {
          ...base,
          metrics: {
            totalAssets: status.closingBalance,
            assigned: status.assigned,
            available: status.available,
            capacityUtilization: percentOfCapacity,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      items: basesWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bases/:id
 */
const getBaseById = async (req, res, next) => {
  try {
    const base = await Base.findById(req.params.id);
    if (!base) {
      return res.status(404).json({
        success: false,
        message: 'Base installation not found.',
      });
    }

    if (req.baseScope && base._id.toString() !== req.baseScope) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to your assigned base.',
      });
    }

    const status = await inventoryService.getInventoryStatus(base._id);

    // Get inventory breakdown by equipment
    const allEquipment = await Equipment.find({ isActive: true }).lean();
    const equipmentBreakdown = await Promise.all(
      allEquipment.map(async (eq) => {
        const eqStatus = await inventoryService.getInventoryStatus(base._id, eq._id);
        return {
          equipment: eq,
          total: eqStatus.closingBalance,
          assigned: eqStatus.assigned,
          available: eqStatus.available,
        };
      })
    );

    // Filter to only items currently stocked or assigned
    const activeInventory = equipmentBreakdown.filter((item) => item.total > 0 || item.assigned > 0);

    // Recent activity for this base
    const [recentPurchases, recentTransfers, recentAssignments, recentExpenditures] =
      await Promise.all([
        Purchase.find({ baseId: base._id }).sort({ purchaseDate: -1 }).limit(5).populate('equipmentId').lean(),
        Transfer.find({ $or: [{ fromBaseId: base._id }, { toBaseId: base._id }] })
          .sort({ transferDate: -1 })
          .limit(5)
          .populate('equipmentId fromBaseId toBaseId')
          .lean(),
        Assignment.find({ baseId: base._id }).sort({ assignmentDate: -1 }).limit(5).populate('equipmentId').lean(),
        Expenditure.find({ baseId: base._id }).sort({ date: -1 }).limit(5).populate('equipmentId').lean(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        ...base.toObject(),
        metrics: {
          totalAssets: status.closingBalance,
          assigned: status.assigned,
          available: status.available,
          capacityUtilization:
            base.capacity > 0 ? Math.min(100, Math.round((status.closingBalance / base.capacity) * 100)) : 0,
        },
        inventory: activeInventory,
        recentActivity: {
          purchases: recentPurchases,
          transfers: recentTransfers,
          assignments: recentAssignments,
          expenditures: recentExpenditures,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bases
 */
const createBase = async (req, res, next) => {
  try {
    const { name, code, location, type, capacity, description, commanderName } = req.body;

    const existing = await Base.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Base with code ${code.toUpperCase()} already exists.`,
      });
    }

    const base = new Base({
      name,
      code: code.toUpperCase(),
      location,
      type: type || 'Tactical Depot',
      capacity: capacity || 25000,
      description,
      commanderName,
    });

    const saved = await base.save();

    await auditService.log({
      req,
      action: 'BASE_CREATED',
      entityType: 'Base',
      entityId: saved._id,
      after: saved,
      notes: `Commissioned new installation: ${name} (${code})`,
    });

    res.status(201).json({
      success: true,
      message: 'Base installation registered successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bases/:id
 */
const updateBase = async (req, res, next) => {
  try {
    const base = await Base.findById(req.params.id);
    if (!base) {
      return res.status(404).json({
        success: false,
        message: 'Base installation not found.',
      });
    }

    const beforeState = base.toObject();
    const { name, location, type, capacity, description, commanderName, isActive } = req.body;

    if (name) base.name = name;
    if (location) base.location = location;
    if (type) base.type = type;
    if (capacity !== undefined) base.capacity = capacity;
    if (description !== undefined) base.description = description;
    if (commanderName !== undefined) base.commanderName = commanderName;
    if (isActive !== undefined) base.isActive = isActive;

    const saved = await base.save();

    await auditService.log({
      req,
      action: 'BASE_UPDATED',
      entityType: 'Base',
      entityId: saved._id,
      before: beforeState,
      after: saved.toObject(),
      notes: `Base ${base.code} updated`,
    });

    res.status(200).json({
      success: true,
      message: 'Base updated successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBases,
  getBaseById,
  createBase,
  updateBase,
};
