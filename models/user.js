const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    uniqueId: String,
    fields: [
        {
            name: String,
            value: String,
        },
    ],
});

// Prevent model overwrite error
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;