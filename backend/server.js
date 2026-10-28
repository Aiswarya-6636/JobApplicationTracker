
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect application routes
const applicationRoutes = require("./routes/applicationRoutes");
app.use("/api/applications", applicationRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker API is running"
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
