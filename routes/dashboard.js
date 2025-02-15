const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const User = require('../models/user');

router.get("/", verifyToken, async (req, res) => {
    try {
        console.log("Authenticated User ID:", req.user.userId); // Debugging

        // Find user by ID from token
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ message: "Welcome to your dashboard!", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
