const express = require('express');
const {
  getExpenditures,
  getExpenditureById,
  createExpenditure,
  deleteExpenditure,
} = require('../controllers/expenditureController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createExpenditureSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getExpenditures);
router.get('/:id', requireBaseAccess, getExpenditureById);

router.post(
  '/',
  requireRole('ADMIN', 'BASE_COMMANDER'),
  requireBaseAccess,
  validate(createExpenditureSchema),
  createExpenditure
);

router.delete('/:id', requireRole('ADMIN'), requireBaseAccess, deleteExpenditure);

module.exports = router;
