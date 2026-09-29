const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { requireBaseAccess } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', requireBaseAccess, getSummary);

module.exports = router;
