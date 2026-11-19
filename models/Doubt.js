
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    answeredBy: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [String]
}, { timestamps: true });

const appreciationSchema = new mongoose.Schema({
    badge: {
        type: String,
        enum: ["curiosity-spark", "deep-thinker", "mind-bender"],
        required: true
    },
    awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    awardedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const doubtSchema = new mongoose.Schema({
    course: { type: String, required: true },
    courseCode: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    postedBy: { type: String, required: true },
    className: String,
    section: String,
    answers: [answerSchema],

    // Faculty appreciation
    appreciation: {
        type: appreciationSchema,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Doubt", doubtSchema);
