const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ["student", "faculty"], required: true },
    userId: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    className: String,
    section: String,
    subjects: [String]
}, { timestamps: true });

userSchema.index({ role: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);