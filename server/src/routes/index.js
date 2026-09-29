const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const transferRoutes = require('./transferRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const expenditureRoutes = require('./expenditureRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const baseRoutes = require('./baseRoutes');
const auditRoutes = require('./auditRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'MILTRACK Asset Operations Platform',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/transfers', transferRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/expenditures', expenditureRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/bases', baseRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes);

module.exports = router;
