const mongoose = require("mongoose")

const User = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    phoneNumber: {type: String},
    expiredAt: {type: Date, required: true},
    duration: {type: String, enum: ['month', 'year'], required: true},
    macAddress: {type: Array, required: true}
});


const UserSchema = mongoose.model("users", User);

module.exports = UserSchema;