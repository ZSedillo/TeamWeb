const express = require("express");
const router = express.Router();
//const uploadHomepage = require("../middleware/uploadHomepage"); // Make sure you have this middleware for file uploads
const fileUpload = require("express-fileupload");
const { getAllImages } = require('../util/getObject');

const {
    uploadImage,
    deleteImage,
    // getAllImages
} = require("../controllers/homepageController");

// router.post("/upload-image", uploadHomepage.single("image"), uploadImage);
router.post("/upload-image", fileUpload(), uploadImage);
router.delete("/delete-image/:filename", deleteImage);
// router.get("/images", getAllImages);
router.get('/get-all-images', async (req, res) => {
    try {
        const imageKeys = await getAllImages(); // Get all image keys

        if (imageKeys.length === 0) {
            return res.status(404).json({ message: "No images found" });
        }

        // Map the image keys to full URLs for the client to access
        const imageUrls = imageKeys.map((key) => {
            return `https://${process.env.AWS_SW_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        });

        // Send the URLs back to the client
        res.json(imageUrls);
    } catch (error) {
        console.error("Error fetching all images:", error);
        res.status(500).json({ message: "Error fetching images" });
    }
});

module.exports = router;
