const express = require('express');
const {
  getBases,
  getBaseById,
  createBase,
  updateBase,
} = require('../controllers/baseController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createBaseSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getBases);
router.get('/:id', requireBaseAccess, getBaseById);

router.post('/', requireRole('ADMIN'), validate(createBaseSchema), createBase);
router.put('/:id', requireRole('ADMIN'), updateBase);

module.exports = router;
