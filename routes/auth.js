
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


// AUTHENTICATE LOGGED-IN USER
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || user.role !== decoded.role) {
            return res.status(401).json({
                message: "Invalid user authentication."
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}


// VERIFY THAT THE REQUEST COMES FROM AN ADMIN
async function requireAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await User.findById(decoded.id);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                message: "Only Admin can perform this action."
            });
        }

        req.admin = admin;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}


// PUBLIC REGISTRATION DISABLED
router.post("/register", (req, res) => {
    return res.status(403).json({
        message: "Public registration is disabled. Contact your Admin."
    });
});


// ADMIN CREATES STUDENT OR FACULTY ACCOUNT
router.post("/admin/create-account", requireAdmin, async (req, res) => {
    try {
        const {
            role,
            userId,
            fullName,
            email,
            temporaryPassword,
            className,
            section,
            subjects
        } = req.body;

        if (!["student", "faculty"].includes(role)) {
            return res.status(400).json({
                message: "Admin can create only student or faculty accounts."
            });
        }

        if (!userId || !fullName || !email || !temporaryPassword) {
            return res.status(400).json({
                message: "Please fill all required fields."
            });
        }

        if (temporaryPassword.length < 8) {
            return res.status(400).json({
                message: "Temporary password must contain at least 8 characters."
            });
        }

        if (role === "student" && (!className || !section)) {
            return res.status(400).json({
                message: "Student class and section are required."
            });
        }

        if (
            role === "faculty" &&
            (!Array.isArray(subjects) || subjects.length === 0)
        ) {
            return res.status(400).json({
                message: "At least one faculty subject is required."
            });
        }

        const cleanUserId = userId.trim();
        const cleanEmail = email.trim().toLowerCase();

        const exists = await User.findOne({
            role,
            userId: cleanUserId
        });

        if (exists) {
            return res.status(409).json({
                message: "This ID is already registered for this role."
            });
        }

        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const newUser = await User.create({
            role,
            userId: cleanUserId,
            fullName: fullName.trim(),
            email: cleanEmail,
            password: hashedPassword,
            mustChangePassword: true,

            className: role === "student" ? className.trim() : undefined,
            section: role === "student" ? section.trim() : undefined,

            subjects: role === "faculty"
                ? subjects.map(subject => subject.trim()).filter(Boolean)
                : undefined
        });

        res.status(201).json({
            message: `${role} account created successfully.`,
            account: {
                role: newUser.role,
                userId: newUser.userId,
                fullName: newUser.fullName,
                mustChangePassword: newUser.mustChangePassword
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This account ID already exists."
            });
        }

        console.error("Account creation error:", error.message);

        res.status(500).json({
            message: "Unable to create account."
        });
    }
});


// CHANGE PASSWORD
router.post("/change-password", authenticateUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Please enter both passwords."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must contain at least 8 characters."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from the temporary password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            req.user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Current password is incorrect."
            });
        }

        req.user.password = await bcrypt.hash(newPassword, 10);
        req.user.mustChangePassword = false;

        await req.user.save();

        res.json({
            message: "Password changed successfully. Please sign in again."
        });

    } catch (error) {
        console.error("Password change error:", error.message);

        res.status(500).json({
            message: "Unable to change password."
        });
    }
});


// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { role, userId, password } = req.body;

        if (!role || !userId || !password) {
            return res.status(400).json({
                message: "Please enter your role, ID and password."
            });
        }

        const user = await User.findOne({
            role,
            userId: userId.trim()
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid ID or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from environment configuration.");
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            token,
            user: {
                role: user.role,
                userId: user.userId,
                fullName: user.fullName,
                className: user.className,
                section: user.section,
                subjects: user.subjects || [],
                mustChangePassword: user.mustChangePassword
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            message: "Unable to log in."
        });
    }
});

module.exports = router;
