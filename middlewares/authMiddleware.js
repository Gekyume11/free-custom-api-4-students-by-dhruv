const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        console.log("Headers Received:", req.headers); // Debugging

        const authHeader = req.headers.authorization; // Ensure correct case
        if (!authHeader) {
            return res.status(401).json({ message: "Access Denied. No token provided." });
        }

        const token = authHeader; // Extract actual token
        console.log("Extracted Token:", token); // Debugging

        const SECRET_KEY = process.env.SECRET_KEY;
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("Decoded Token:", decoded); // Debugging

        req.user = decoded; // Attach decoded token data to request
        next();
    } catch (err) {
        console.log("Token Verification Error:", err.message); // Debugging
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

module.exports = verifyToken;
