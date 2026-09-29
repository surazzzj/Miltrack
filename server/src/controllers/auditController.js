const { AuditLog } = require('../models');

/**
 * GET /api/audit-logs
 * READ-ONLY audit history
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      action,
      entityType,
      baseId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // RBAC Scoping
    if (req.user.role === 'BASE_COMMANDER') {
      const userBaseId = req.user.baseId?._id || req.user.baseId;
      query.baseId = userBaseId;
    } else if (req.user.role === 'LOGISTICS_OFFICER') {
      // Logistics officers see logistics and asset mutations
      query.entityType = { $in: ['Purchase', 'Transfer', 'Assignment', 'Expenditure', 'Equipment'] };
      if (req.user.baseId) {
        query.baseId = req.user.baseId?._id || req.user.baseId;
      }
    } else if (baseId) {
      query.baseId = baseId;
    }

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate('baseId', 'name code')
        .populate('userId', 'fullName email rank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
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
 * GET /api/audit-logs/:id
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('baseId', 'name code')
      .populate('userId', 'fullName email rank');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log entry not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
