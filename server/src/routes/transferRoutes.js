const express = require('express');
const {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransferStatus,
  deleteTransfer,
} = require('../controllers/transferController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createTransferSchema, updateTransferStatusSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getTransfers);
router.get('/:id', requireBaseAccess, getTransferById);

router.post(
  '/',
  requireRole('ADMIN', 'LOGISTICS_OFFICER'),
  requireBaseAccess,
  validate(createTransferSchema),
  createTransfer
);

router.patch(
  '/:id/status',
  requireRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  requireBaseAccess,
  validate(updateTransferStatusSchema),
  updateTransferStatus
);

router.delete('/:id', requireRole('ADMIN'), requireBaseAccess, deleteTransfer);

module.exports = router;
