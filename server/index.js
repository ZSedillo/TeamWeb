const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./db.js');

const homepageRoutes = require("./homepage/homepage.routes");
const announcementRoutes = require("./announcement/announcement.routes");
const calendarRoutes = require("./calendar/calendar.routes");
const preRegistrationRoutes = require("./preregistration/preRegistration.routes");
const bookRoutes = require("./book/book.routes");
const reportRoutes = require('./report/report.routes');
const userRoutes = require('./user/user.routes');

// Load .env variables
dotenv.config();

const app = express();

// --- Security Middleware ---

// Force HTTPS redirect in production
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// Add secure headers
app.use(helmet());

// Rate limiter (to prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per IP
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// JSON body parser
app.use(express.json());

// CORS config
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://teamweb-production.up.railway.app",
    "https://teamweb.up.railway.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// --- Database connection ---
connectDB();

// --- Serve static frontend ---
const frontendPath = path.join(__dirname, "..", "teamweb");
app.use(express.static(frontendPath));

// --- API Routes ---
app.use("/homepage", express.static(path.join(__dirname, "homepage")));
app.use("/homepage", homepageRoutes);

app.use("/announcement", announcementRoutes);
app.use("/announcement", express.static(path.join(__dirname, "announcement")));

app.use("/calendar", calendarRoutes);
app.use('/preregistration', preRegistrationRoutes);
app.use("/booking", bookRoutes);
app.use('/report', reportRoutes);
app.use('/user', userRoutes);

// --- Catch unknown API routes ---
app.all([
  '/preregistration/*',
  '/booking/*',
  '/user/*',
  '/report/*',
  '/calendar/*',
  '/announcement/*'
], (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// --- Catch all for frontend routes (SPA fallback) ---
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// --- Start the server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
