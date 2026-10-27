const express = require('express');
const controller = require('../controllers/authController');
const { issueCsrfToken } = require('../middleware/requireAuth');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' } });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.' } });
router.get('/csrf', issueCsrfToken);
router.post('/register', registerLimiter, controller.register);
router.post('/login', loginLimiter, controller.login);
router.get('/me', controller.currentUser);
router.post('/logout', controller.logout);

module.exports = router;
