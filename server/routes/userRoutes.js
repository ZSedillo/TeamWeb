const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');

// Authentication routes
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/edit-password', authenticate, userController.editPassword);

// User management routes
router.post('/update-user-info', authenticate, userController.updateUserInfo);
router.delete('/delete-account', authenticate, userController.deleteAccount);
router.get('/current-user', authenticate, userController.getCurrentUser);

module.exports = router;
