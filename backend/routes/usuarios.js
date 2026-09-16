const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/usuarioController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, getAll);
router.post('/', authenticateToken, requireAdmin, create);
router.put('/:id', authenticateToken, requireAdmin, update);
router.delete('/:id', authenticateToken, requireAdmin, remove);

module.exports = router;