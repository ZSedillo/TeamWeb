const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authenticate = require('../middleware/authMiddleware');

// Authentication routes (public - no auth required)
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/logout', authenticate, userController.logout);
router.get('/check-auth', authenticate, userController.checkAuth);

// User management routes (protected - auth required)
router.post('/edit-password', authenticate, userController.editPassword);
router.post('/update-user-info', authenticate, userController.updateUserInfo);
router.delete('/delete-account', authenticate, userController.deleteAccount);
router.get('/current-user', authenticate, userController.getCurrentUser);

module.exports = router;