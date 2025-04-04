const Homepage = require('../models/Homepage')
const { v4} = require("uuid");
const { putObject } = require('../util/putObject');
const { deleteObject } = require('../util/deleteObject');

const uploadImage = async (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const file = req.files.image;
        const fileName = `images/${v4()}`;

        // Upload image to S3
        const { url, key } = await putObject(file.data, fileName);

        if (!url || !key) {
            return res.status(400).json({ status: "error", data: "Image is not uploaded" });
        }

        const newImage = new Homepage({
            image_url: url,key,
            created_at: new Date(),
        });

        await newImage.save();
        res.status(201).json({ message: "Image uploaded successfully", image: newImage });
    } catch (error) {
        console.error("Error saving image:", error);
        res.status(500).json({ message: "Error saving image to database" });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params; // This will now be just the object key (e.g., images/4973147c-b2e4-46f8-ba5a-e0912784d69e)

        // Find and delete the image from the database
        const deletedImage = await Homepage.findOneAndDelete({ image_url: `https://teamweb-image.s3.ap-southeast-1.amazonaws.com/${filename}` });

        if (!deletedImage) {
            return res.status(404).json({ message: "Image not found in database" });
        }

        // Delete image from S3
        const data = await deleteObject(filename);  // Pass the object key (filename) to delete from S3
        if (data.status !== 204) {
            return res.status(500).json({ message: "Failed to delete image from S3", error: data });
        }

        res.json({ message: "Image deleted successfully from database and S3" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Error deleting image", error: error.message });
    }
};


// Get all images
const getAllImages = async (req, res) => {
    try {
        const images = await Homepage.find();
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving images" });
    }
};

module.exports = { uploadImage, deleteImage, getAllImages };

