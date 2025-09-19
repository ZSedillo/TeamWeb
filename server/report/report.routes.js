// routes/reportRoutes.js
const express = require('express');
const {
  viewReports,
  searchReports,
  addReport,
  deleteReports
} = require('./report.controller');

const authenticate = require('../middleware/authMiddleware'); // Import the middleware

const router = express.Router();

// Protected Routes (require login)
router.get('/view-report', authenticate, viewReports);
router.get('/search-reports', authenticate, searchReports);
router.post('/add-report', authenticate, addReport);
router.delete('/delete-reports', authenticate, deleteReports);

module.exports = router;
