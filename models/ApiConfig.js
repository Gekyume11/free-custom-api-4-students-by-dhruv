const mongoose = require("mongoose");

const ApiConfigSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true },
    requiredFields: { type: [String], required: true },
    fieldTypes: { type: [String], required: true },
    apiToken: { type: String, required: true },
    data: { type: Array, default: [] }
});

module.exports = mongoose.model("ApiConfig", ApiConfigSchema);