const platformUser = require("../models/platformUser");

exports.verifyToken = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        console.log("🔍 Received Unique ID:", uniqueId);

        if (!req.headers.authorization) {
            console.error("🚨 Missing Authorization Header");
            return res.status(401).json({ error: "Missing Authorization token." });
        }

        const extractedToken = req.headers.authorization.replace("Bearer ", "").trim();
        console.log("🔑 Extracted Token:", extractedToken);

        // Fix the findOne query to properly retrieve data
        const userConfig = await platformUser.findOne({ _id: uniqueId });
        if (!userConfig) {
            console.error("🚨 API Config Not Found for ID:", uniqueId);
            return res.status(404).json({ error: "Invalid API link or user not found." });
        }

        console.log("🔐 Stored API Token in DB:", userConfig.apiToken);

        if (extractedToken !== userConfig.apiToken) {
            console.error("🚨 Token Mismatch!");
            return res.status(403).json({ error: "Unauthorized: Invalid API token." });
        }

        return res.status(200).json({ message: "Token is valid." });
    } catch (err) {
        console.error("❌ Server Error:", err.message);
        res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }
};