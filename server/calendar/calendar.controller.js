const calendarModel = require("./calendar.model");

// ✅ Get all Calendar Entries
const getAllCalendarEntries = async (req, res) => {
    try {
        const response = await calendarModel.find();
        res.json({ calendar: response });
    } catch (error) {
        console.error("Error fetching calendar entries:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Add a new Calendar Entry
const addCalendarEntry = async (req, res) => {
    const { title, date } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: "Missing required fields: title or date" });
    }

    try {
        const newEntry = new calendarModel({ title, date, created_at: new Date(), type: "event" });
        const savedEntry = await newEntry.save();
        res.status(201).json({ message: "Calendar entry added successfully", entry: savedEntry });
    } catch (error) {
        console.error("Error adding calendar entry:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Edit a Calendar Entry
const editCalendarEntry = async (req, res) => {
    const { id } = req.params;
    const { title, date } = req.body;

    try {
        const updatedEntry = await calendarModel.findByIdAndUpdate(
            id,
            { title, date, type: "event" },
            { new: true }
        );

        if (!updatedEntry) return res.status(404).json({ error: "Calendar entry not found" });

        res.json({ message: "Calendar entry updated successfully", entry: updatedEntry });
    } catch (error) {
        console.error("Error updating calendar entry:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Delete a Calendar Entry
const deleteCalendarEntry = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEntry = await calendarModel.findByIdAndDelete(id);
        if (!deletedEntry) return res.status(404).json({ error: "Calendar entry not found" });

        res.json({ message: "Calendar entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting calendar entry:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const deletePreviousYearEntries = async (req, res) => {
    const currentYear = new Date().getFullYear(); // Get the current year
    const previousYear = currentYear - 1; // Calculate the previous year

    try {
        const deletedEntries = await calendarModel.deleteMany({
            date: { 
                $gte: new Date(`${previousYear}-01-01`), 
                $lt: new Date(`${previousYear + 1}-01-01`)
            }
        });

        if (deletedEntries.deletedCount === 0) {
            return res.status(404).json({ message: `No calendar entries found for ${previousYear}` });
        }

        res.json({ message: `All calendar entries from ${previousYear} deleted successfully` });
    } catch (error) {
        console.error("Error deleting previous year's calendar entries:", error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { 
    getAllCalendarEntries, 
    addCalendarEntry, 
    editCalendarEntry, 
    deleteCalendarEntry,
    deletePreviousYearEntries 
};
