const mongoose = require('mongoose');
const { InventoryTransaction, Assignment } = require('../models');

class InventoryService {
  /**
   * Record a new inventory transaction in the ledger
   */
  async recordTransaction(
    {
      transactionType,
      baseId,
      equipmentId,
      quantity,
      referenceType,
      referenceId,
      direction,
      transactionDate = new Date(),
      createdBy = null,
      metadata = {},
    },
    session = null
  ) {
    const transaction = new InventoryTransaction({
      transactionType,
      baseId,
      equipmentId,
      quantity,
      referenceType,
      referenceId,
      direction,
      transactionDate,
      createdBy,
      metadata,
    });

    return session ? transaction.save({ session }) : transaction.save();
  }

  /**
   * Calculate current physical closing balance for a base and equipment
   * Based entirely on the immutable InventoryTransaction ledger
   */
  async getLedgerBalance(baseId, equipmentId = null, asOfDate = null) {
    const match = {
      baseId: new mongoose.Types.ObjectId(baseId),
    };

    if (equipmentId) {
      match.equipmentId = new mongoose.Types.ObjectId(equipmentId);
    }

    if (asOfDate) {
      match.transactionDate = { $lte: new Date(asOfDate) };
    }

    const result = await InventoryTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalIn: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0],
            },
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0],
            },
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return 0;
    }

    return (result[0].totalIn || 0) - (result[0].totalOut || 0);
  }

  /**
   * Get active assigned quantity for base and equipment
   */
  async getActiveAssignedQuantity(baseId, equipmentId = null) {
    const match = {
      baseId: new mongoose.Types.ObjectId(baseId),
      status: 'ACTIVE',
    };

    if (equipmentId) {
      match.equipmentId = new mongoose.Types.ObjectId(equipmentId);
    }

    const result = await Assignment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: '$quantity' },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalAssigned : 0;
  }

  /**
   * Get complete inventory status: Closing Balance, Assigned, and Available
   */
  async getInventoryStatus(baseId, equipmentId = null) {
    const totalPhysical = await this.getLedgerBalance(baseId, equipmentId);
    const assigned = await this.getActiveAssignedQuantity(baseId, equipmentId);
    const available = Math.max(0, totalPhysical - assigned);

    return {
      closingBalance: totalPhysical,
      assigned,
      available,
    };
  }

  /**
   * Validate if sufficient unassigned stock is available
   */
  async validateStockAvailability(baseId, equipmentId, requestedQuantity) {
    const status = await this.getInventoryStatus(baseId, equipmentId);
    return {
      hasSufficientStock: status.available >= requestedQuantity,
      available: status.available,
      closingBalance: status.closingBalance,
      assigned: status.assigned,
    };
  }

  /**
   * Calculate exact dashboard accounting metrics across a given date range
   */
  async getAccountingSummary({ baseId = null, equipmentId = null, equipmentType = null, dateFrom = null, dateTo = null }) {
    const baseMatch = {};
    if (baseId) {
      baseMatch.baseId = new mongoose.Types.ObjectId(baseId);
    }
    if (equipmentId) {
      baseMatch.equipmentId = new mongoose.Types.ObjectId(equipmentId);
    }

    const startDate = dateFrom ? new Date(dateFrom) : null;
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // 1. OPENING BALANCE: Transactions strictly before dateFrom
    let openingBalance = 0;
    if (startDate) {
      const openingAgg = await InventoryTransaction.aggregate([
        {
          $match: {
            ...baseMatch,
            transactionDate: { $lt: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
            totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } },
          },
        },
      ]);
      if (openingAgg.length > 0) {
        openingBalance = (openingAgg[0].totalIn || 0) - (openingAgg[0].totalOut || 0);
      }
    }

    // 2. PERIOD TRANSACTIONS: between startDate (or beginning of time) and endDate
    const periodMatch = { ...baseMatch };
    if (startDate) {
      periodMatch.transactionDate = { $gte: startDate, $lte: endDate };
    } else {
      periodMatch.transactionDate = { $lte: endDate };
    }

    const periodAgg = await InventoryTransaction.aggregate([
      { $match: periodMatch },
      {
        $group: {
          _id: '$transactionType',
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    let purchases = 0;
    let transferIn = 0;
    let transferOut = 0;
    let expended = 0;

    periodAgg.forEach((item) => {
      if (item._id === 'PURCHASE') purchases = item.totalQuantity;
      if (item._id === 'TRANSFER_IN') transferIn = item.totalQuantity;
      if (item._id === 'TRANSFER_OUT') transferOut = item.totalQuantity;
      if (item._id === 'EXPENDITURE') expended = item.totalQuantity;
    });

    // NET MOVEMENT = Purchases + Transfer In - Transfer Out
    const netMovement = purchases + transferIn - transferOut;

    // CLOSING BALANCE = Opening Balance + Purchases + Transfer In - Transfer Out - Expenditures
    const closingBalance = openingBalance + netMovement - expended;

    // 3. CURRENT ACTIVE ASSIGNMENTS
    const assignMatch = { status: 'ACTIVE' };
    if (baseId) assignMatch.baseId = new mongoose.Types.ObjectId(baseId);
    if (equipmentId) assignMatch.equipmentId = new mongoose.Types.ObjectId(equipmentId);

    const assignAgg = await Assignment.aggregate([
      { $match: assignMatch },
      { $group: { _id: null, totalAssigned: { $sum: '$quantity' } } },
    ]);
    const assigned = assignAgg.length > 0 ? assignAgg[0].totalAssigned : 0;

    // AVAILABLE = Closing Balance - Active Assigned Quantity
    const available = Math.max(0, closingBalance - assigned);

    return {
      openingBalance,
      purchases,
      transferIn,
      transferOut,
      netMovement,
      assigned,
      expended,
      closingBalance,
      available,
    };
  }
}

module.exports = new InventoryService();
