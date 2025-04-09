const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.findOne({ username });
        if (!user) return res.status(400).json({ error: "Incorrect Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect Credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ 
            message: "Success", 
            token,
            user: { id: user._id, username: user.username, email: user.email || 'No email provided' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (await userModel.findOne({ username })) return res.status(400).json({ error: "Username already exists" });
        if (await userModel.findOne({ email })) return res.status(400).json({ error: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ username, email, password: hashedPassword });
        await newUser.save();

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { username } = req.body;
    try {
        const user = await userModel.findOne({ email: username });
        if (!user) return res.status(404).json({ error: "No account found with that email" });

        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: "User verified successfully", resetToken, userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

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
        res.status(500).json({ error: "Server error" });
    }
};

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
        if (username && !(await userModel.findOne({ username }))) updateData.username = username;
        if (email && !(await userModel.findOne({ email }))) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);

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
        if (currentUser.role === 'head_admin') {
            const headAdminCount = await userModel.countDocuments({ role: 'head_admin' });
            if (headAdminCount <= 1 && currentUser._id.toString() === targetUserId) {
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
