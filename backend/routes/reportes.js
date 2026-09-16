const express = require('express');
const router = express.Router();
const { getStats, getChartData } = require('../controllers/reporteController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, getStats);
router.get('/chart/:table/:column', authenticateToken, getChartData);

module.exports = router;