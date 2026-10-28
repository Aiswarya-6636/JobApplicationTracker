
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true
    },

    jobRole: {
      type: String,
      required: true,
      trim: true
    },

    jobType: {
      type: String,
      enum: ["Full-time", "Internship", "Contract"],
      required: true
    },

    appliedDate: {
      type: Date,
      required: true
    },

    salary: {
      type: Number,
      default: null
    },

    notes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Interview",
        "Offer",
        "Rejected",
        "Accepted",
        "Declined"
      ],
      default: "Applied"
    },

    followUpDate: {
      type: Date,
      required: true
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);
