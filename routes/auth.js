const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { role, userId, fullName, email, password, className, section, subjects } = req.body;

        if (!["student", "faculty"].includes(role) || !userId || !fullName || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must contain at least 8 characters." });
        }

        const exists = await User.findOne({ role, userId });
        if (exists) {
            return res.status(409).json({ message: "This ID is already registered." });
        }

        const hashed = await bcrypt.hash(password, 10);

        await User.create({
            role, userId, fullName, email, password: hashed,
            className: role === "student" ? className : undefined,
            section: role === "student" ? section : undefined,
            subjects: role === "faculty" ? subjects : undefined
        });

        res.status(201).json({ message: "Account created. Please sign in." });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { role, userId, password } = req.body;

        const user = await User.findOne({ role, userId });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid ID or password." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                role: user.role,
                userId: user.userId,
                fullName: user.fullName,
                className: user.className,
                section: user.section,
                subjects: user.subjects || []
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

module.exports = router;