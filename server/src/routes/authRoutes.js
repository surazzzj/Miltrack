const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validators/schemas');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

module.exports = router;
