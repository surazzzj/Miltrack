const express = require('express');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;
