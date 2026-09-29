const mongoose = require('mongoose');
const {
  InventoryTransaction,
  Assignment,
  Equipment,
  Base,
  Purchase,
  Transfer,
  Expenditure,
} = require('../models');
const inventoryService = require('./inventoryService');

class DashboardService {
  /**
   * Complete Dashboard analytics payload calculated from real MongoDB data
   */
  async getDashboardData({ baseId = null, equipmentId = null, equipmentType = null, dateFrom = null, dateTo = null }) {
    // 1. Accounting KPI Summary
    const summary = await inventoryService.getAccountingSummary({
      baseId,
      equipmentId,
      equipmentType,
      dateFrom,
      dateTo,
    });

    // 2. Velocity Trend Chart (Grouped by week or recent periods)
    const velocityTrend = await this.getMovementVelocityTrend({ baseId });

    // 3. Classification Distribution (Donut Chart)
    const classificationDistribution = await this.getClassificationDistribution({ baseId });

    // 4. Base Distribution (Depot Progress Bars)
    const baseDistribution = await this.getBaseDistribution();

    // 5. Recent Activity Ledger
    const recentActivity = await this.getRecentOperationalActivity({ baseId, limit: 6 });

    return {
      summary,
      charts: {
        velocityTrend,
        classificationDistribution,
        baseDistribution,
      },
      recentActivity,
    };
  }

  async getMovementVelocityTrend({ baseId = null }) {
    const match = {};
    if (baseId) {
      match.baseId = new mongoose.Types.ObjectId(baseId);
    }

    // Rolling 8-week timeline
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
    match.transactionDate = { $gte: eightWeeksAgo };

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$transactionDate' },
            year: { $isoWeekYear: '$transactionDate' },
            type: '$transactionType',
          },
          total: { $sum: '$quantity' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 },
      },
    ];

    const results = await InventoryTransaction.aggregate(pipeline);

    // Build standard 8 week slots
    const weeksMap = new Map();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = `W${8 - i} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      weeksMap.set(label, {
        period: label,
        purchases: 0,
        transfersIn: 0,
        transfersOut: 0,
        expenditures: 0,
      });
    }

    // Map aggregated results to timeline array
    const weekLabels = Array.from(weeksMap.keys());
    results.forEach((row, index) => {
      const targetLabel = weekLabels[Math.min(weekLabels.length - 1, Math.floor((index / (results.length || 1)) * weekLabels.length))];
      const entry = weeksMap.get(targetLabel);
      if (entry) {
        if (row._id.type === 'PURCHASE') entry.purchases += row.total;
        if (row._id.type === 'TRANSFER_IN') entry.transfersIn += row.total;
        if (row._id.type === 'TRANSFER_OUT') entry.transfersOut += row.total;
        if (row._id.type === 'EXPENDITURE') entry.expenditures += row.total;
      }
    });

    return Array.from(weeksMap.values());
  }

  async getClassificationDistribution({ baseId = null }) {
    const match = {};
    if (baseId) {
      match.baseId = new mongoose.Types.ObjectId(baseId);
    }

    // Group inventory transactions by equipment type
    const inventoryByEquipment = await InventoryTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$equipmentId',
          balance: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'equipment',
          localField: '_id',
          foreignField: '_id',
          as: 'equipment',
        },
      },
      { $unwind: '$equipment' },
      {
        $group: {
          _id: '$equipment.type',
          totalQuantity: { $sum: '$balance' },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    const total = inventoryByEquipment.reduce((acc, curr) => acc + Math.max(0, curr.totalQuantity), 0);

    const typeLabels = {
      VEHICLE: 'Armored & Tactical Vehicles',
      WEAPON: 'Weapons & Small Arms',
      AMMUNITION: 'Ammunition & Explosives',
      COMMUNICATION: 'C4ISR Communications',
      PROTECTIVE: 'Field Support & Medical',
      OTHER: 'General Support Items',
    };

    const typeColors = {
      WEAPON: '#131b2e',
      VEHICLE: '#006398',
      AMMUNITION: '#0c9488',
      COMMUNICATION: '#5bb8fe',
      PROTECTIVE: '#7c839b',
      OTHER: '#94a3b8',
    };

    return inventoryByEquipment.map((item) => {
      const count = Math.max(0, item.totalQuantity);
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        type: item._id,
        name: typeLabels[item._id] || item._id,
        value: count,
        percentage,
        color: typeColors[item._id] || '#006398',
      };
    });
  }

  async getBaseDistribution() {
    const bases = await Base.find({ isActive: true }).lean();

    const distribution = await Promise.all(
      bases.map(async (base) => {
        const status = await inventoryService.getInventoryStatus(base._id);
        const percentOfCapacity = base.capacity > 0 ? Math.min(100, Math.round((status.closingBalance / base.capacity) * 100)) : 0;

        return {
          baseId: base._id,
          name: base.name,
          code: base.code,
          type: base.type,
          capacity: base.capacity,
          totalUnits: status.closingBalance,
          assigned: status.assigned,
          available: status.available,
          percentage: percentOfCapacity,
        };
      })
    );

    return distribution.sort((a, b) => b.totalUnits - a.totalUnits);
  }

  async getRecentOperationalActivity({ baseId = null, limit = 6 }) {
    const filter = {};
    if (baseId) {
      filter.baseId = baseId;
    }

    const [purchases, transfers, assignments, expenditures] = await Promise.all([
      Purchase.find(filter).sort({ createdAt: -1 }).limit(limit).populate('equipmentId baseId createdBy').lean(),
      Transfer.find(baseId ? { $or: [{ fromBaseId: baseId }, { toBaseId: baseId }] } : {})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('equipmentId fromBaseId toBaseId initiatedBy')
        .lean(),
      Assignment.find(filter).sort({ createdAt: -1 }).limit(limit).populate('equipmentId baseId assignedBy').lean(),
      Expenditure.find(filter).sort({ createdAt: -1 }).limit(limit).populate('equipmentId baseId recordedBy').lean(),
    ]);

    const events = [];

    purchases.forEach((p) => {
      events.push({
        id: p._id,
        type: 'PURCHASE',
        title: `${p.quantity}x ${p.equipmentId?.name || p.assetDescription || 'Equipment'}`,
        code: p.purchaseNumber,
        baseName: p.baseId?.name || 'Base Depot',
        officer: p.createdBy?.fullName || 'Logistics Officer',
        time: p.createdAt,
        status: p.status,
        quantity: p.quantity,
      });
    });

    transfers.forEach((t) => {
      events.push({
        id: t._id,
        type: 'TRANSFER',
        title: `${t.quantity}x ${t.equipmentId?.name || t.assetDescription || 'Equipment'}`,
        code: t.transferNumber,
        baseName: `${t.fromBaseId?.name || 'Base'} → ${t.toBaseId?.name || 'Base'}`,
        officer: t.initiatedBy?.fullName || 'Dispatch Officer',
        time: t.createdAt,
        status: t.status,
        quantity: t.quantity,
      });
    });

    assignments.forEach((a) => {
      events.push({
        id: a._id,
        type: 'ASSIGNMENT',
        title: `${a.quantity}x ${a.equipmentId?.name || 'Equipment'} to ${a.personnelName}`,
        code: a.assignmentNumber,
        baseName: a.baseId?.name || 'Depot',
        officer: a.assignedBy?.fullName || 'Unit Commander',
        time: a.createdAt,
        status: a.status,
        quantity: a.quantity,
      });
    });

    expenditures.forEach((e) => {
      events.push({
        id: e._id,
        type: 'EXPENDITURE',
        title: `${e.quantity}x ${e.equipmentId?.name || e.assetDescription || 'Expendables'} (${e.reason})`,
        code: e.expenditureNumber,
        baseName: e.baseId?.name || 'Live Range',
        officer: e.recordedBy?.fullName || 'Range Master',
        time: e.createdAt,
        status: 'Expended',
        quantity: e.quantity,
      });
    });

    // Sort by timestamp descending
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);
  }
}

module.exports = new DashboardService();
