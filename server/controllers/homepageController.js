const Homepage = require('../models/Homepage')

const path = require('path');
const fs = require('fs');
const { v4} = require("uuid");
const { putObject } = require('../util/putObject');
const { deleteObject } = require('../util/deleteObject');
const url = require('url'); // For URL parsing

// Upload Image
// const uploadImage = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     try {
//         const newImage = new Homepage({
//             image_url: req.file.filename, // Save only filename
//             created_at: new Date(),
//         });

//         await newImage.save();
//         res.status(201).json({ message: "Image uploaded successfully", image: newImage });
//     } catch (error) {
//         console.error("Error saving image:", error);
//         res.status(500).json({ message: "Error saving image to database" });
//     }
// };
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



// Delete Image
// const deleteImage = async (req, res) => {
//     try {
//         const { filename } = req.params;

//         // Find and delete from MongoDB
//         const deletedImage = await Homepage.findOneAndDelete({ image_url: filename });

//         if (!deletedImage) {
//             return res.status(404).json({ message: "Image not found in database" });
//         }

//         // Delete from server storage
//         const filePath = path.join(__dirname, "../homepage", filename);
//         fs.unlink(filePath, (err) => {
//             if (err) {
//                 console.error("Error deleting file:", err);
//                 return res.status(500).json({ message: "Failed to delete file from server" });
//             }
//             res.json({ message: "Image deleted successfully" });
//         });
//     } catch (error) {
//         console.error("Error deleting image:", error);
//         res.status(500).json({ message: "Error deleting image" });
//     }
// };

const deleteImage = async (req, res) => {
  try {
    const { id, filename } = req.params; // Extract both image ID and filename (key)

    // Find and delete the image from the database using the ID
    const deletedImage = await Homepage.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({ message: "Image not found in database" });
    }

    // Now, delete the image from S3 using the key (filename)
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename, // Image S3 object key
    };

    // Delete the object from S3
    const data = await deleteObject(s3Params); 

    if (data.$metadata.httpStatusCode !== 204) {
      return res.status(500).json({ message: "Failed to delete image from S3" });
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

