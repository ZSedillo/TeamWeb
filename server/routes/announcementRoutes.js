const express = require("express");
const router = express.Router();
// const uploadAnnouncement = require("../middleware/uploadAnnouncement");
const fileUpload = require("express-fileupload");
const {
    getAllAnnouncements,
    addAnnouncement,
    editAnnouncement,
    deleteAnnouncement
} = require("../controllers/announcementController");
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

// Routes
router.get("/", getAllAnnouncements);
router.post("/add", authenticate, fileUpload(), addAnnouncement);
router.put("/edit/:id", authenticate, fileUpload(), editAnnouncement);
router.delete("/delete/:id", authenticate, deleteAnnouncement);

module.exports = router;
