const express = require('express');
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
} = require('../controllers/equipmentController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createEquipmentSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getEquipment);
router.get('/:id', requireBaseAccess, getEquipmentById);

router.post(
  '/',
  requireRole('ADMIN', 'LOGISTICS_OFFICER'),
  validate(createEquipmentSchema),
  createEquipment
);

router.put('/:id', requireRole('ADMIN', 'LOGISTICS_OFFICER'), updateEquipment);

module.exports = router;
