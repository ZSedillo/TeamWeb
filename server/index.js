const express = require('express')
const connectDB = require('./db.js')

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const homepageRoutes = require("./routes/homepageRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const preRegistrationRoutes = require("./routes/preRegistrationRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config(); 
const cors = require('cors')

const app = express()
const router = express.Router();

app.use(express.json())
// app.use(cors())
app.use(cors({
    origin: ["http://localhost:5173", "https://teamweb-production.up.railway.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }));
  

connectDB()

// Set the correct path for static frontend files
const frontendPath = path.join(__dirname, "..", "teamweb", "dist");
fs.readdir(frontendPath, (err, files) => {
    if (err) console.error("Error reading dist directory:", err);
    else console.log("Dist directory contents:", files);
  });

app.use(express.static(frontendPath));

app.use("/homepage", express.static(path.join(__dirname, "homepage")));
app.use("/homepage", homepageRoutes);

app.use("/announcement", announcementRoutes);
app.use("/announcement", express.static(path.join(__dirname, "announcement")));

app.use("/calendar", calendarRoutes); 
app.use('/preregistration', preRegistrationRoutes);
app.use("/booking", bookRoutes);
app.use('/report', reportRoutes);
app.use('/user', userRoutes);

app.use("/", router); 

app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// app.listen(3000,() => {
//     console.log("app is running");
// })

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
