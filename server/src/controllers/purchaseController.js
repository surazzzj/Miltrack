const mongoose = require('mongoose');
const { Purchase, Equipment, Base, InventoryTransaction } = require('../models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');

/**
 * GET /api/purchases
 */
const getPurchases = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
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
      query.baseId = effectiveBaseId;
    }

    if (equipmentId) {
      query.equipmentId = equipmentId;
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.purchaseDate = {};
      if (dateFrom) query.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) query.purchaseDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { assetDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Purchase.find(query)
        .populate('baseId', 'name code location')
        .populate('equipmentId', 'name type code unitOfMeasure')
        .populate('createdBy', 'fullName email rank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Purchase.countDocuments(query),
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
 * GET /api/purchases/:id
 */
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('baseId')
      .populate('equipmentId')
      .populate('createdBy', 'fullName email rank');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found.',
      });
    }

    if (req.baseScope && purchase.baseId._id.toString() !== req.baseScope) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to your base installation.',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

const { withOptionalTransaction } = require('../utils/dbUtils');

/**
 * POST /api/purchases
 */
const createPurchase = async (req, res, next) => {
  try {
    const {
      purchaseDate,
      baseId,
      equipmentId,
      assetDescription,
      quantity,
      unitCost,
      supplier,
      referenceNumber,
      notes,
      status = 'COMPLETED',
    } = req.body;

    const targetBaseId = req.baseScope || baseId;

    // Verify equipment exists
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Referenced equipment not found.',
      });
    }

    // Auto-generate unique Purchase Order Number
    const count = await Purchase.countDocuments();
    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totalCost strictly on the server
    const calculatedTotalCost = Math.round(quantity * unitCost * 100) / 100;

    const savedPurchase = await withOptionalTransaction(async (session) => {
      const purchase = new Purchase({
        purchaseNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        baseId: targetBaseId,
        equipmentId,
        assetDescription: assetDescription || equipment.name,
        quantity,
        unitCost,
        totalCost: calculatedTotalCost,
        supplier,
        referenceNumber,
        notes,
        status,
        createdBy: req.user._id,
      });

      const saved = session ? await purchase.save({ session }) : await purchase.save();

      // If completed, record transaction in the inventory ledger
      if (status === 'COMPLETED') {
        await inventoryService.recordTransaction(
          {
            transactionType: 'PURCHASE',
            baseId: targetBaseId,
            equipmentId,
            quantity,
            direction: 'IN',
            referenceType: 'Purchase',
            referenceId: saved._id,
            transactionDate: saved.purchaseDate,
            createdBy: req.user._id,
            metadata: {
              purchaseNumber: saved.purchaseNumber,
              supplier: saved.supplier,
            },
          },
          session
        );
      }

      return saved;
    });

    // Record audit log
    await auditService.log({
      req,
      action: 'PURCHASE_CREATED',
      entityType: 'Purchase',
      entityId: savedPurchase._id,
      baseId: targetBaseId,
      after: savedPurchase,
      notes: `Procured ${quantity} units of ${equipment.name} from ${supplier}`,
    });

    const populated = await Purchase.findById(savedPurchase._id)
      .populate('baseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('createdBy', 'fullName rank');

    res.status(201).json({
      success: true,
      message: 'Purchase recorded and inventory updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/purchases/:id
 */
const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found.',
      });
    }

    if (req.baseScope && purchase.baseId.toString() !== req.baseScope) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const beforeState = purchase.toObject();

    // Update allowable fields
    const { quantity, unitCost, supplier, referenceNumber, notes, status, purchaseDate } = req.body;

    if (quantity !== undefined) purchase.quantity = quantity;
    if (unitCost !== undefined) purchase.unitCost = unitCost;
    if (supplier !== undefined) purchase.supplier = supplier;
    if (referenceNumber !== undefined) purchase.referenceNumber = referenceNumber;
    if (notes !== undefined) purchase.notes = notes;
    if (purchaseDate !== undefined) purchase.purchaseDate = new Date(purchaseDate);

    // Recalculate totalCost safely
    purchase.totalCost = Math.round(purchase.quantity * purchase.unitCost * 100) / 100;

    const previousStatus = purchase.status;
    if (status !== undefined) purchase.status = status;

    await purchase.save();

    // Sync inventory ledger if status changed
    if (previousStatus !== purchase.status) {
      if (purchase.status === 'COMPLETED') {
        await inventoryService.recordTransaction({
          transactionType: 'PURCHASE',
          baseId: purchase.baseId,
          equipmentId: purchase.equipmentId,
          quantity: purchase.quantity,
          direction: 'IN',
          referenceType: 'Purchase',
          referenceId: purchase._id,
          transactionDate: purchase.purchaseDate,
          createdBy: req.user._id,
        });
      } else if (previousStatus === 'COMPLETED') {
        // Rollback transaction if now cancelled or pending
        await InventoryTransaction.deleteMany({
          referenceId: purchase._id,
          referenceType: 'Purchase',
        });
      }
    }

    await auditService.log({
      req,
      action: 'PURCHASE_UPDATED',
      entityType: 'Purchase',
      entityId: purchase._id,
      baseId: purchase.baseId,
      before: beforeState,
      after: purchase.toObject(),
      notes: `Purchase ${purchase.purchaseNumber} updated`,
    });

    const updated = await Purchase.findById(purchase._id)
      .populate('baseId', 'name code')
      .populate('equipmentId', 'name type code unitOfMeasure')
      .populate('createdBy', 'fullName rank');

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/purchases/:id
 */
const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found.',
      });
    }

    if (req.baseScope && purchase.baseId.toString() !== req.baseScope) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const beforeState = purchase.toObject();

    // Clean up inventory ledger entries associated with this purchase
    await InventoryTransaction.deleteMany({
      referenceId: purchase._id,
      referenceType: 'Purchase',
    });

    await purchase.deleteOne();

    await auditService.log({
      req,
      action: 'PURCHASE_DELETED',
      entityType: 'Purchase',
      entityId: purchase._id,
      baseId: purchase.baseId,
      before: beforeState,
      notes: `Purchase ${purchase.purchaseNumber} deleted and ledger reverted`,
    });

    res.status(200).json({
      success: true,
      message: 'Purchase record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
