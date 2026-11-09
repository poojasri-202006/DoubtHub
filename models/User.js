
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["student", "faculty"],
            required: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        userId: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        className: {
            type: String,
            trim: true,
            required: function () {
                return this.role === "student";
            }
        },

        section: {
            type: String,
            trim: true,
            required: function () {
                return this.role === "student";
            }
        },

        subjects: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate IDs within the same role.
userSchema.index(
    { role: 1, userId: 1 },
    { unique: true }
);

// Prevent duplicate email addresses.
userSchema.index(
    { email: 1 },
    { unique: true }
);

module.exports = mongoose.model("User", userSchema);
