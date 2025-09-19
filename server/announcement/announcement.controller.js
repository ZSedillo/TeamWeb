const path = require("path");
const fs = require("fs");
const announcementModel = require("./announcement.model");
const { v4 } = require("uuid");
const { putObjectAnnouncement } = require("../util/putObjectAnnouncement");
const { deleteObjectAnnouncement } = require("../util/deleteObjectAnnouncement");

// 📌 Get all announcements
const getAllAnnouncements = async (req, res) => {
    try {
        const response = await announcementModel.find();
        res.json({ announcements: response });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

const addAnnouncement = async (req, res) => {
    try {
        const { title, description } = req.body;

        let image_url = req.file ? req.file.filename : null; // Use let here to allow reassignment

        // Check if an image is being uploaded
        if (req.files && req.files.image) {
            const file = req.files.image;
            const fileName = `announcements/${v4()}`;
            const { url,key } = await putObjectAnnouncement(file.data, fileName);

            if (!url || !key) {
                return res.status(400).json({ message: "Image upload failed" });
            }

            // Reassign image_url with the URL from the image upload
            image_url = url,key;
        }

        // Create the new announcement with the title, description, and image_url
        const newAnnouncement = new announcementModel({ title, description, image_url });
        await newAnnouncement.save();

        res.status(201).json({ message: "Announcement added successfully", newAnnouncement });
    } catch (error) {
        console.error("Error adding announcement:", error);
        res.status(500).json({ error: "Failed to add announcement" });
    }
};

const editAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const existingAnnouncement = await announcementModel.findById(id);
        if (!existingAnnouncement) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        let image_url = existingAnnouncement.image_url;

        if (req.files && req.files.image) {
            const file = req.files.image;
            const fileName = `announcements/${v4()}`;
            const { url } = await putObjectAnnouncement(file.data, fileName);

            if (!url) {
                return res.status(400).json({ message: "Image upload failed" });
            }

            // Derive key from previous URL
            if (image_url) {
                const filename = image_url.split("https://teamweb-announcement.s3.ap-southeast-1.amazonaws.com/")[1];
                if (filename) await deleteObjectAnnouncement(filename);
            }

            image_url = url;
        }

        const updatedAnnouncement = await announcementModel.findByIdAndUpdate(
            id,
            { title, description, image_url },
            { new: true }
        );

        res.status(200).json({ message: "Announcement updated successfully", updatedAnnouncement });
    } catch (error) {
        console.error("Error updating announcement:", error);
        res.status(500).json({ error: "Failed to update announcement" });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await announcementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        // Delete image from S3 if it exists
        if (announcement.image_url) {
            const key = announcement.image_url.split("https://teamweb-announcement.s3.ap-southeast-1.amazonaws.com/")[1];
            if (key) await deleteObjectAnnouncement(key);
        }

        await announcementModel.findByIdAndDelete(id);

        res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ error: "Failed to delete announcement" });
    }
};



module.exports = {
    getAllAnnouncements,
    addAnnouncement,
    editAnnouncement,
    deleteAnnouncement
};
