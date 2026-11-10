
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use(express.static(__dirname));
app.use("/api/doubts", require("./routes/doubt"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");

        app.listen(process.env.PORT || 3000, () => {
            console.log("DoubtHub running at http://localhost:3000");
        });
    })
    .catch((error) => {
        console.log("Database error:", error.message);
    });
