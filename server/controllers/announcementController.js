const path = require("path");
const fs = require("fs");
const announcementModel = require("../models/Announcement");
const { v4 } = require("uuid");
const { putObject } = require("../util/putObjectAnnouncement");
const { deleteObject } = require("../util/deleteObjectAnnouncement");

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

// 📌 Add a new announcement
const addAnnouncement = async (req, res) => {
    try {
        const { title, description } = req.body;
        const image_url = req.file ? req.file.filename : null;

        const newAnnouncement = new announcementModel({ title, description, image_url });
        await newAnnouncement.save();

        res.status(201).json({ message: "Announcement added successfully", newAnnouncement });
    } catch (error) {
        console.error("Error adding announcement:", error);
        res.status(500).json({ error: "Failed to add announcement" });
    }
};

// 📌 Edit an existing announcement
const editAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const existingAnnouncement = await announcementModel.findById(id);
        if (!existingAnnouncement) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        let image_url = existingAnnouncement.image_url;
        if (req.file) {
            image_url = req.file.filename;

            // Delete old image if it exists
            if (existingAnnouncement.image_url) {
                const oldImagePath = path.join(__dirname, "../announcement", existingAnnouncement.image_url);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error("Error deleting old image:", err);
                });
            }
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

// 📌 Delete an announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await announcementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        if (announcement.image_url) {
            const imagePath = path.join(__dirname, "../announcement", announcement.image_url);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Error deleting image:", err);
            });
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
