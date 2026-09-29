const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const { baseId, equipmentId, equipmentType, dateFrom, dateTo } = req.query;

    // If Base Commander or baseScope set, enforce baseId
    const effectiveBaseId = req.baseScope || baseId || null;

    const data = await dashboardService.getDashboardData({
      baseId: effectiveBaseId,
      equipmentId: equipmentId || null,
      equipmentType: equipmentType || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
};
