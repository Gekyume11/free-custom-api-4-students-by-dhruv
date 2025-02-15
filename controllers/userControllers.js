const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const PlatformUser = require("../models/platformUser"); // Import PlatformUser model
const sendMail = require("./sendEmail");

// 📌 Validate Platform User and Generate API Token
exports.userSignup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        // Check if platform user exists
        const platformUser = await PlatformUser.findOne({ email });

        if (!platformUser) {
            return res.status(403).json({
                error: "Unauthorized. Please sign up as a platform user first.",
            });
        }

        // Check if API user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "API user already exists. Please log in." });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate API token
        const apiToken = crypto.randomBytes(32).toString("hex");

        // Create API user
        const newUser = new User({ email, password: hashedPassword, apiToken });
        await newUser.save();

        // Send API token via email
        const subject = "Your Custom API Token - Free_APIs4_Students_by_Dhruv";
        const message = `
            You have successfully signed up to generate your own APIs! 🎉<br><br>
            Here is your API token:<br>
            <strong>${apiToken}</strong><br><br>
            Attach this token in the headers as <code>Authorization: Bearer YOUR_API_TOKEN</code> when using your custom APIs.
        `;
        await sendMail(email, subject, message);

        res.json({ message: "Signup successful! Check your email for your API token." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 User Login (Validates API User and Resends API Token)
exports.userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        // Validate platform user
        const platformUser = await PlatformUser.findOne({ email });

        if (!platformUser) {
            return res.status(403).json({
                error: "Unauthorized. Please sign up as a platform user first.",
            });
        }

        // Find API user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: `API user not found. Please sign up to generate a custom API.`,
            });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid password." });
        }

        // Send API token via email
        const subject = "Your API Token - Free_APIs4_Students_by_Dhruv";
        const message = `
            You have successfully logged in! 🎉<br><br>
            Here is your API token:<br>
            <strong>${user.apiToken}</strong><br><br>
            Attach this token in the headers as <code>Authorization: Bearer YOUR_API_TOKEN</code> when using your custom APIs.
        `;
        await sendMail(email, subject, message);

        res.json({ message: "Login successful! Check your email for your API token." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};