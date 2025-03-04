const express = require('express')
const connectDB = require('./db.js')
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');


const userModel = require('./models/user.js')

// const homepageModel = require('./models/Homepage.js')
const homepageRoutes = require("./routes/homepageRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const calendarRoutes = require("./routes/calendarRoutes");

// const announcementModel = require('./models/Announcement.js')
//const calendarModel = require('./models/Calendar.js');
const preRegistrationModel = require('./models/PreRegistration.js');


dotenv.config(); 
const cors = require('cors')

const app = express()
const router = express.Router();

app.use(express.json())
app.use(cors())

connectDB()


app.use("/homepage", express.static(path.join(__dirname, "homepage")));
app.use("/homepage", homepageRoutes);

app.use("/announcement", announcementRoutes);
app.use("/announcement", express.static(path.join(__dirname, "announcement")));

app.use("/calendar", calendarRoutes); 

//Get all Calendar
app.get('/calendar', async (req,res) =>{
    const response = await calendarModel.find();
    return res.json({calendar : response});
})

//Get all Pre-Registration
// Get paginated Pre-Registration records
app.get('/preregistration', async (req, res) => {
    try {
        // Get page and limit from query params (default: page 1, limit 10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch records with pagination
        const records = await preRegistrationModel.find()
            .skip(skip)
            .limit(limit);

        // Count total records for pagination info
        const totalRecords = await preRegistrationModel.countDocuments();

        res.json({
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            preregistration: records,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// POST - Add a new Pre-Registration
app.post('/addPreRegistration', async (req, res) => {
    let { 
        name, 
        phone_number, 
        age, 
        strand, // Optional
        grade_level, // Required
        email, 
        status, 
        appointment_date, 
        nationality, 
        parent_guardian_name, 
        parent_guardian_number, 
        preferred_time, 
        purpose_of_visit,
        isNewStudent // ✅ Required (new/old)
    } = req.body;

    // Check if grade_level and isNewStudent are missing
    if (!grade_level) {
        return res.status(400).json({ error: "Grade level is required." });
    }
    if (!isNewStudent || !['new', 'old'].includes(isNewStudent.toLowerCase())) {
        return res.status(400).json({ error: "isNewStudent must be 'new' or 'old'." });
    }

    // Convert status to lowercase if provided
    if (status) {
        status = status.toLowerCase();
    }

    // Validate status against allowed values
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status value. Allowed values: ${validStatuses.join(', ')}` });
    }

    try {
        // Check if a pre-registration with the same email already exists
        const existingPreRegistration = await preRegistrationModel.findOne({ email });
        
        let preRegistrationData;
        if (existingPreRegistration) {
            // If entry exists, update the existing pre-registration
            preRegistrationData = await preRegistrationModel.findOneAndUpdate(
                { email }, // Find the document by email
                { 
                    name,
                    phone_number,
                    age,
                    strand: strand || null, // Optional
                    grade_level, // Required
                    nationality,
                    parent_guardian_name,
                    parent_guardian_number,
                    isNewStudent: isNewStudent.toLowerCase(), // Ensure lowercase for consistency
                    status: status || 'pending', // Default to 'pending' if not provided
                    appointment_date: appointment_date || null, // Optional
                    preferred_time: preferred_time || null, // Optional
                    purpose_of_visit: purpose_of_visit || null // Optional
                },
                { new: true } // Return the updated document
            );
        } else {
            // If no existing entry, create a new one
            preRegistrationData = new preRegistrationModel({
                name,
                phone_number,
                age,
                strand: strand || null, // Optional
                grade_level, // Required
                email,
                nationality,
                parent_guardian_name,
                parent_guardian_number,
                isNewStudent: isNewStudent.toLowerCase(), // Ensure lowercase for consistency
                status: status || 'pending', // Default to 'pending' if not provided
                appointment_date: appointment_date || null, // Optional
                preferred_time: preferred_time || null, // Optional
                purpose_of_visit: purpose_of_visit || null // Optional
            });

            // Save the new entry
            await preRegistrationData.save();
        }

        res.status(201).json({ message: "Pre-registration processed successfully", preregistration: preRegistrationData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


// POST - Add a Booking
app.post('/addBooking', async (req, res) => {
    const { email, appointment_date, preferred_time, purpose_of_visit } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required to update the booking." });
    }

    try {
        const user = await preRegistrationModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found. Please register first." });
        }

        // Update appointment details
        user.appointment_date = appointment_date || user.appointment_date;
        user.preferred_time = preferred_time || user.preferred_time;
        user.purpose_of_visit = purpose_of_visit || user.purpose_of_visit;

        await user.save();
        res.status(200).json({ message: "Appointment updated successfully", user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});



//==========ADMIN CODE==============
//Add bycrpt and hash if register will be included in the future
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await userModel.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Incorrect Credentials" });
        }

        // Directly compare the plain-text password with the stored password
        if (password !== user.password) {
            return res.status(400).json({ error: "The password is incorrect" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: "Success", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});



const authenticate = require('./middleware/authMiddleware'); // Import middleware

app.get('/admin-homepage', authenticate, (req, res) => {
    res.json({ message: "Welcome to the Admin Homepage!" });
});


//REGISTER TEMP CODE
// app.post('/register', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const existingUser = await userModel.findOne({ username });
//         if (existingUser) return res.status(400).json({ error: "Username already exists" });

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new userModel({ username, password: hashedPassword });
//         await newUser.save();

//         res.json({ message: "User registered successfully" });
//     } catch (error) {
//         res.status(500).json({ error: "Server error" });
//     }
// });

// app.use("/announcement", router);
// app.use("/announcement", express.static(path.join(__dirname, "announcement")));


app.listen(3000,() => {
    console.log("app is running");
})
