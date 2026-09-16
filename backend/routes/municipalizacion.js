const express = require('express');
const router = express.Router();
const { getTables, getTableData } = require('../controllers/municipalizacionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getTables);
router.get('/tabla/:table', authenticateToken, getTableData);

module.exports = router;