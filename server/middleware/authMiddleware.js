// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const userModel = require('../user/user.model.js');

const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required. No token provided.' });
        }
        
        // Extract token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by id
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add user info to request
        req.user = { id: user._id };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = authenticate;