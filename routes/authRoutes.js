const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
// ✅ FIX: Path was '../middleware/auth' (lowercase) — folder is 'Middleware' (uppercase)
const { protect } = require('../Middleware/auth');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;