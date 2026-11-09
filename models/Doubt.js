const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    answeredBy: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [String]
}, { timestamps: true });

const doubtSchema = new mongoose.Schema({
    course: { type: String, required: true },
    courseCode: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    postedBy: { type: String, required: true },
    className: String,
    section: String,
    answers: [answerSchema]
}, { timestamps: true });

module.exports = mongoose.model("Doubt", doubtSchema);