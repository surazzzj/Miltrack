const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validators/schemas');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN')); // ADMIN ONLY

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);

module.exports = router;
