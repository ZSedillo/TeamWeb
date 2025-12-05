const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model'); // Adjust path if needed
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

// Cookie options for HTTP-only cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 60 * 60 * 1000 // 1 hour
};

// --- HELPER: EMAIL SENDER ---
const sendEmail = async (options) => {
    // Configure this with your actual email provider details
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USERNAME, // Make sure these form .env
            pass: process.env.EMAIL_PASSWORD  // Make sure these form .env
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(mailOptions);
};

// --- AUTH CONTROLLERS ---

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.findOne({ username });
        if (!user) return res.status(400).json({ error: "Incorrect Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect Credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('authToken', token, cookieOptions);

        res.status(200).json({ 
            message: "Success", 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email || 'No email provided',
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        if (await userModel.findOne({ username })) return res.status(400).json({ error: "Username already exists" });
        if (await userModel.findOne({ email })) return res.status(400).json({ error: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ username, email, password: hashedPassword, role: role || 'admin' });
        await newUser.save();

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none'
        });
        
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.checkAuth = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ 
            authenticated: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// --- PASSWORD RESET FLOW (UPDATED) ---

// 1. Send OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email: email });
        if (!user) return res.status(404).json({ error: "No account found with that email" });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (Expires in 10 minutes)
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        const message = `Your password reset verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Verification Code',
                message
            });
            // We do NOT send the token here anymore, just the success message
            res.status(200).json({ message: "Verification code sent to email" });
        } catch (emailError) {
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpire = undefined;
            await user.save();
            console.error("Email send error:", emailError);
            return res.status(500).json({ error: "Email could not be sent. Check server logs." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// 2. Verify OTP (New Function)
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await userModel.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: Date.now() } // Check if expire time is in the future
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification code" });
        }

        // OTP is valid. Generate the Reset Token.
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Clear OTP
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Code verified", 
            resetToken, 
            userId: user._id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// 3. Reset Password (Using Token)
exports.resetPassword = async (req, res) => {
    const { password, token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Invalid or expired token" });
    }
};

// --- USER MANAGEMENT CONTROLLERS ---

exports.editPassword = async (req, res) => {
    const { password, targetUserId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await userModel.findByIdAndUpdate(targetUserId, { password: hashedPassword });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateUserInfo = async (req, res) => {
    const { targetUserId, username, email, password } = req.body;
    try {
        const updateData = {};
        
        // Check uniqueness only if changing
        if (username) {
             const exists = await userModel.findOne({ username });
             if (exists && exists._id.toString() !== targetUserId) return res.status(400).json({ error: "Username taken" });
             updateData.username = username;
        }
        if (email) {
             const exists = await userModel.findOne({ email });
             if (exists && exists._id.toString() !== targetUserId) return res.status(400).json({ error: "Email taken" });
             updateData.email = email;
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await userModel.findByIdAndUpdate(targetUserId, { $set: updateData }, { new: true, select: '-password' });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ message: "User information updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteAccount = async (req, res) => {
    const { targetUserId } = req.body;
    try {
        const currentUser = await userModel.findById(req.user.id);
        
        // Prevent deleting the last head_admin
        if (currentUser.role === 'head_admin') {
            const headAdminCount = await userModel.countDocuments({ role: 'head_admin' });
            // If there is only 1 head admin and we are trying to delete a user who IS a head_admin (checked by ID)
            const targetUser = await userModel.findById(targetUserId);
            if (headAdminCount <= 1 && targetUser.role === 'head_admin') {
                return res.status(400).json({ error: 'Cannot delete the last head admin account' });
            }
        }

        const deletedUser = await userModel.findByIdAndDelete(targetUserId);
        if (!deletedUser) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role === 'head_admin') {
            const admins = await userModel.find({ role: { $in: ['head_admin', 'admin'] } }).sort({ role: -1 }).select('-password');
            return res.status(200).json({ user, admins });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};