const express = require('express');
const {
    getPreRegistrations,
    addPreRegistration,
    updatePreRegistrationStatus,
    updatePreregistrationEnrollmentStatus,
    getEnrolledPreRegistrations,
    addBooking,
    deletePreRegistration,
    deletePreRegistrationById
} = require('../controllers/preRegistrationController');

const authenticate = require('../middleware/authMiddleware'); // Import the auth middleware

const router = express.Router();

// Public routes
router.post('/add', addPreRegistration);
router.post('/addBooking', addBooking);

// Protected routes
router.get('/view-preregistration', authenticate, getPreRegistrations);
router.put('/status/:id', authenticate, updatePreRegistrationStatus);
router.put('/enrollment/:id', authenticate, updatePreregistrationEnrollmentStatus);
router.get('/enrolled', authenticate, getEnrolledPreRegistrations);
router.delete('/deleteAll', authenticate, deletePreRegistration);
router.delete('/delete/:id', authenticate, deletePreRegistrationById);

module.exports = router;
