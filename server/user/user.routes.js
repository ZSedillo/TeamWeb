const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authMiddleware');

// Authentication routes (public)
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/reset-password', userController.resetPassword);

// Authentication routes (protected)
router.post('/logout', authenticate, userController.logout);
router.get('/check-auth', authenticate, userController.checkAuth);

// User management routes (protected)
router.post('/edit-password', authenticate, userController.editPassword);
router.post('/update-user-info', authenticate, userController.updateUserInfo);
router.delete('/delete-account', authenticate, userController.deleteAccount);
router.get('/current-user', authenticate, userController.getCurrentUser);

module.exports = router;