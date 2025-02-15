const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const ApiConfig = require("../models/ApiConfig");
const sendMail = require("./sendEmail");

// 📌 Generate Custom API
exports.generateAPI = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: "Unauthorized: Missing token." });

        const platformToken = token.replace("Bearer ", "");
        jwt.verify(platformToken, process.env.SECRET_KEY, async (err, decoded) => {
            if (err) return res.status(403).json({ error: "Invalid or expired token." });

            const userEmail = decoded.email;
            if (!userEmail) return res.status(401).json({ error: "Unauthorized: No user found." });

            const { fieldNames, fieldTypes } = req.body;
            if (!fieldNames || !fieldTypes || fieldNames.length !== fieldTypes.length) {
                return res.status(400).json({ error: "Field names and types are required." });
            }

            const allowedTypes = ["text", "number", "date", "email", "password", "boolean", "object", "array", "null", "undefined"];
            if (fieldTypes.some(type => !allowedTypes.includes(type))) {
                return res.status(400).json({ error: "Invalid field type detected." });
            }

            const uniqueId = uuidv4();
            const apiToken = jwt.sign({ apiId: uniqueId }, process.env.SECRET_KEY, { expiresIn: "24h" });

            const apiConfig = new ApiConfig({
                uniqueId,
                requiredFields: fieldNames,
                fieldTypes,
                createdBy: userEmail,
                apiToken,
                data: []
            });

            await apiConfig.save();

            const apiBaseURL = `${process.env.BASEURL}${uniqueId}`;
            const apiHeaders = { Authorization: `${apiToken}` };

            const emailContent = `
                <p>Your custom API has been generated successfully!</p>
                <p><strong>API Link:</strong> ${apiBaseURL}</p>
                <p><strong>Authorization Header:</strong> ${apiToken}</p>
                <p>You can now perform CRUD operations using this API.</p>
            `;
            await sendMail(userEmail, "Your Custom API Link", emailContent);

            res.json({
                message: `API link and token sent to ${userEmail}.`,
                apiURL: apiBaseURL,
                headers: apiHeaders
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 Handle GET Requests
exports.handleGetRequest = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const apiConfig = await ApiConfig.findOne({ uniqueId });

        if (!apiConfig) return res.status(404).json({ error: "Invalid API link." });

        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: "Missing Authorization token." });

        if (token !== apiConfig.apiToken) {
            return res.status(403).json({ error: "Unauthorized: Invalid API token." });
        }

        return res.json({ message: "Fetching API data...", data: apiConfig.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 Handle POST Requests
exports.handlePostRequest = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const apiConfig = await ApiConfig.findOne({ uniqueId });

        if (!apiConfig) return res.status(404).json({ error: "Invalid API link." });

        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: "Missing Authorization token." });

        const extractedToken = token.replace("Bearer ", "");
        if (extractedToken !== apiConfig.apiToken) {
            return res.status(403).json({ error: "Unauthorized: Invalid API token." });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "No data provided. Please send valid data." });
        }

        const newData = {};
        const missingFields = [];
        const invalidFields = [];

        const validateType = (value, type) => {
            switch (type) {
                case "text":
                    return typeof value === "string";

                case "number":
                    return typeof value === "number";

                case "boolean":
                    return typeof value === "boolean";

                case "date": {
                    // Match dd-mm-yyyy format strictly
                    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                    if (typeof value !== "string" || !dateRegex.test(value)) return false;

                    // Extract day, month, and year from the string
                    const [, day, month, year] = value.match(dateRegex).map(Number);

                    // Check if month is between 1 and 12
                    if (month < 1 || month > 12) return false;

                    // Check if day is valid for the given month and year
                    const maxDaysInMonth = new Date(year, month, 0).getDate(); // Get last day of the month
                    if (day < 1 || day > maxDaysInMonth) return false;

                    return true;
                }

                case "email":
                    return (
                        typeof value === "string" &&
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
                    );

                case "password":
                    return typeof value === "string" && value.length >= 6;

                default:
                    return false;
            }
        };

        for (let i = 0; i < apiConfig.requiredFields.length; i++) {
            const fieldName = apiConfig.requiredFields[i];
            const fieldType = apiConfig.fieldTypes[i];

            if (!(fieldName in req.body)) {
                missingFields.push(fieldName);
            } else if (!validateType(req.body[fieldName], fieldType)) {
                invalidFields.push("key name '" + fieldName + "' should be a " + (fieldType === 'date' ? ' in dd-mm-yyyy format (e.g., 06-11-2005) with realistic values only.' : fieldType + '.'));
            } else {
                newData[fieldName] = req.body[fieldName];
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
        }

        if (invalidFields.length > 0) {
            return res.status(400).json({ error: `Invalid data format for fields: ${invalidFields.join(", ")}` });
        }

        newData.id = uuidv4();
        apiConfig.data.push(newData);
        await apiConfig.save();

        return res.json({ message: "New data added successfully!", data: newData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 Handle PUT Requests
exports.handlePutRequest = async (req, res) => {
    try {
        const { uniqueId, updateId } = req.params;
        const apiConfig = await ApiConfig.findOne({ uniqueId });

        if (!apiConfig) return res.status(404).json({ error: "Invalid API link." });

        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: "Missing Authorization token." });

        const extractedToken = token.replace("Bearer ", ""); // Remove "Bearer " if present

        if (extractedToken !== apiConfig.apiToken) {
            return res.status(403).json({ error: "Unauthorized: Invalid API token." });
        }

        const recordId = updateId;
        if (!recordId) {
            return res.status(400).json({ error: "Missing record ID in request parameters." });
        }

        const index = apiConfig.data.findIndex(item => item.id === recordId);
        if (index === -1) {
            return res.status(404).json({ error: "Record not found." });
        }

        // ✅ Ensure the update is detected
        apiConfig.data[index] = { ...apiConfig.data[index], ...req.body };

        // ✅ Mark array as modified to ensure Mongoose saves it
        apiConfig.markModified("data");

        await apiConfig.save();

        return res.json({ message: "Record updated successfully!", data: apiConfig.data[index] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 Handle DELETE Requests
exports.handleDeleteRequest = async (req, res) => {
    try {
        const { uniqueId, deleteId } = req.params;
        const apiConfig = await ApiConfig.findOne({ uniqueId });

        if (!apiConfig) return res.status(404).json({ error: "Invalid API link." });

        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ error: "Missing Authorization token." });

        const extractedToken = token.replace("Bearer ", ""); // Remove "Bearer " if present

        if (extractedToken !== apiConfig.apiToken) {
            return res.status(403).json({ error: "Unauthorized: Invalid API token." });
        }

        const index = apiConfig.data.findIndex(item => item.id === deleteId);
        if (index === -1) {
            return res.status(404).json({ error: "Record not found." });
        }

        apiConfig.data.splice(index, 1); // Remove the record
        await apiConfig.save(); // Save changes to the database

        return res.json({ message: "Record deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
