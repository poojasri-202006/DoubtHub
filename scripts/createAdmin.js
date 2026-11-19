
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("../models/User");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function createAdmin() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const existingAdmin = await User.findOne({ role: "admin" });

        if (existingAdmin) {
            console.log("An Admin account already exists. Setup stopped.");
            return;
        }

        const userId = (await ask("Enter Admin login ID: ")).trim();
        const fullName = (await ask("Enter Admin name: ")).trim();
        const email = (await ask("Enter Admin email: ")).trim().toLowerCase();
        const password = await ask("Enter Admin password (minimum 8 characters): ");

        if (!userId || !fullName || !email || password.length < 8) {
            throw new Error("Invalid details. Please provide all fields and a password of at least 8 characters.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            role: "admin",
            userId,
            fullName,
            email,
            password: hashedPassword,
            mustChangePassword: false
        });

        console.log("First Admin account created successfully.");
    } catch (error) {
        console.error("Admin setup failed:", error.message);
    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => {});
    }
}

createAdmin();
