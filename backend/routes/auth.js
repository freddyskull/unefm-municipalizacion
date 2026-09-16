const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;