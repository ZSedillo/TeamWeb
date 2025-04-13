// routes/reportRoutes.js
const express = require('express');
const { viewReports, searchReports, addReport, deleteReports } = require('../controllers/reportController');

const router = express.Router();

// Routes
router.get('/view-report', viewReports);
router.get('/search-reports', searchReports);
router.post('/add-report', addReport);
router.delete('/delete-reports', deleteReports);

module.exports = router;