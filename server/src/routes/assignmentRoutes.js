const express = require('express');
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireBaseAccess } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createAssignmentSchema, updateAssignmentSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireBaseAccess, getAssignments);
router.get('/:id', requireBaseAccess, getAssignmentById);

router.post(
  '/',
  requireRole('ADMIN', 'BASE_COMMANDER'),
  requireBaseAccess,
  validate(createAssignmentSchema),
  createAssignment
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'BASE_COMMANDER'),
  requireBaseAccess,
  validate(updateAssignmentSchema),
  updateAssignment
);

router.delete('/:id', requireRole('ADMIN'), requireBaseAccess, deleteAssignment);

module.exports = router;
