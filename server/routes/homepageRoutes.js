const express = require("express");
const router = express.Router();
//const uploadHomepage = require("../middleware/uploadHomepage"); // Make sure you have this middleware for file uploads
const fileUpload = require("express-fileupload");

const {
    uploadImage,
    deleteImage,
    getAllImages
} = require("../controllers/homepageController");
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

// router.post("/upload-image", uploadHomepage.single("image"), uploadImage);
router.post("/upload-image", authenticate, fileUpload(), uploadImage);
router.delete("/delete-image/:filename", authenticate, deleteImage);
router.get("/images", getAllImages);

module.exports = router;
