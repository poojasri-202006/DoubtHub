
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// STUDENT AND FACULTY REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const {
            role,
            fullName,
            userId,
            email,
            password,
            className,
            section,
            subjects
        } = req.body;

        const selectedRole = String(role || "").toLowerCase();
        const normalizedId = String(userId || "").trim().toUpperCase();
        const normalizedEmail = String(email || "").trim().toLowerCase();

        if (!["student", "faculty"].includes(selectedRole)) {
            return res.status(400).json({
                message: "Invalid account type."
            });
        }

        if (!fullName || !normalizedId || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        if (selectedRole === "student" && (!className || !section)) {
            return res.status(400).json({
                message: "Class and section are required."
            });
        }

        const subjectList = Array.isArray(subjects)
            ? subjects
            : String(subjects || "").split(",");

        const cleanedSubjects = subjectList
            .map(subject => String(subject).trim())
            .filter(Boolean);

        if (selectedRole === "faculty" && cleanedSubjects.length === 0) {
            return res.status(400).json({
                message: "Please enter at least one assigned subject."
            });
        }

        const existingEmail = await User.findOne({
            email: normalizedEmail
        });

        if (existingEmail) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const existingUser = await User.findOne({
            role: selectedRole,
            userId: normalizedId
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This ID is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            role: selectedRole,
            fullName: fullName.trim(),
            userId: normalizedId,
            email: normalizedEmail,
            password: hashedPassword,
            className: selectedRole === "student" ? className.trim() : undefined,
            section: selectedRole === "student" ? section.trim() : undefined,
            subjects: selectedRole === "faculty" ? cleanedSubjects : []
        });

        await newUser.save();

        return res.status(201).json({
            message: "Registration successful! Please sign in."
        });

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This ID or email is already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});


// STUDENT AND FACULTY LOGIN
router.post("/login", async (req, res) => {
    try {
        const { role, userId, password } = req.body;

        const selectedRole = String(role || "").toLowerCase();
        const normalizedId = String(userId || "").trim().toUpperCase();

        if (!["student", "faculty"].includes(selectedRole)) {
            return res.status(400).json({
                message: "Invalid account type."
            });
        }

        if (!normalizedId || !password) {
            return res.status(400).json({
                message: "Please enter your ID and password."
            });
        }

        const user = await User.findOne({
            role: selectedRole,
            userId: normalizedId
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid ID or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid ID or password."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                role: user.role,
                fullName: user.fullName,
                userId: user.userId,
                email: user.email,
                className: user.className,
                section: user.section,
                subjects: user.subjects
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
});

module.exports = router;

