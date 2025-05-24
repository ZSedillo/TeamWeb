const express = require('express');
const connectDB = require('./db.js');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const homepageRoutes = require("./routes/homepageRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const preRegistrationRoutes = require("./routes/preRegistrationRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const router = express.Router();

// ✅ Setup CORS before anything else
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://teamweb-production.up.railway.app", "https://teamweb.up.railway.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ✅ Allow preflight requests
app.options("*", cors());

// ✅ Body parser
app.use(express.json());

// ✅ Connect to database
connectDB();

// ✅ Serve frontend static files
const frontendPath = path.join(__dirname, "..", "teamweb");
app.use(express.static(frontendPath));

// ✅ Define routes
app.use("/homepage", express.static(path.join(__dirname, "homepage")));
app.use("/homepage", homepageRoutes);

app.use("/announcement", express.static(path.join(__dirname, "announcement")));
app.use("/announcement", announcementRoutes);

app.use("/calendar", calendarRoutes); 
app.use("/preregistration", preRegistrationRoutes);
app.use("/booking", bookRoutes);
app.use("/report", reportRoutes);
app.use("/user", userRoutes);

// ✅ Fallback route for SPA
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
