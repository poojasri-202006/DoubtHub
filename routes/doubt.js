const express = require("express");
const jwt = require("jsonwebtoken");
const Doubt = require("../models/Doubt");
const User = require("../models/User");

const router = express.Router();

async function protect(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) throw new Error("No user");
        next();
    } catch (error) {
        res.status(401).json({ message: "Please sign in again." });
    }
}

router.post("/", protect, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can post doubts." });
        }
        const { course, courseCode, topic, title, description } = req.body;
        if (!course || !courseCode || !title || !description) {
            return res.status(400).json({ message: "Please fill all required fields." });
        }
        const doubt = await Doubt.create({
            course, courseCode, topic, title, description,
            postedBy: req.user.userId,
            className: req.user.className,
            section: req.user.section
        });
        res.status(201).json({ message: "Doubt posted!", doubt });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

router.get("/", protect, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "student") {
            filter = { className: req.user.className, section: req.user.section };
        } else {
            filter = { course: { $in: req.user.subjects } };
        }
        const doubts = await Doubt.find(filter).sort({ createdAt: -1 }).lean();

        doubts.forEach(d => {
            delete d.postedBy;
            d.answers.forEach(a => delete a.likedBy);
        });
        res.json(doubts);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

router.post("/:id/answers", protect, async (req, res) => {
    try {
        const text = (req.body.text || "").trim();
        if (!text) return res.status(400).json({ message: "Please enter an answer." });

        const doubt = await Doubt.findById(req.params.id);
        if (!doubt) return res.status(404).json({ message: "Doubt not found." });

        doubt.answers.push({ text, answeredBy: req.user.userId });
        await doubt.save();
        res.status(201).json({ message: "Answer saved!" });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

router.post("/:id/answers/:answerId/like", protect, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.id);
        if (!doubt) return res.status(404).json({ message: "Doubt not found." });

        const answer = doubt.answers.id(req.params.answerId);
        if (!answer) return res.status(404).json({ message: "Answer not found." });

        if (answer.likedBy.includes(req.user.userId)) {
            return res.status(400).json({ message: "You already liked this." });
        }
        answer.likedBy.push(req.user.userId);
        answer.likes += 1;
        await doubt.save();
        res.json({ likes: answer.likes });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

module.exports = router;