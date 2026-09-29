const express = require('express');
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require('../controllers/purchaseController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createPurchaseSchema, updatePurchaseSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getPurchases);
router.get('/:id', requireBaseAccess, getPurchaseById);

router.post(
  '/',
  requireRole('ADMIN', 'LOGISTICS_OFFICER'),
  requireBaseAccess,
  validate(createPurchaseSchema),
  createPurchase
);

router.put(
  '/:id',
  requireRole('ADMIN', 'LOGISTICS_OFFICER'),
  requireBaseAccess,
  validate(updatePurchaseSchema),
  updatePurchase
);

router.delete('/:id', requireRole('ADMIN'), requireBaseAccess, deletePurchase);

module.exports = router;
