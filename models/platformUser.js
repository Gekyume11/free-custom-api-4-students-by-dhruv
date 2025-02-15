const mongoose = require("mongoose");

const PlatformUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    apiToken: { type: String, required: true }
});

module.exports = mongoose.model("PlatformUser", PlatformUserSchema);