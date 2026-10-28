
const express = require("express");
const Application = require("../models/Application");
const Counter = require("../models/Counter");

const router = express.Router();

const allowedTransitions = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: []
};

function isFutureDate(value) {
  const date = new Date(value);
  const today = new Date();

  if (Number.isNaN(date.getTime())) return true;

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date > today;
}

// GET: View applications, filter by status, or search by company
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.company) {
      filter.companyName = {
        $regex: req.query.company,
        $options: "i"
      };
    }

    const applications = await Application.find(filter).sort({
      createdAt: -1
    });

    const data = applications.map((app) => ({
      ...app.toObject(),
      isOverdue:
        app.status === "Applied" &&
        new Date() > new Date(app.followUpDate)
    }));

    res.json({
      success: true,
      message: "Applications fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// GET: Count applications by status
router.get("/stats", async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      message: "Statistics fetched successfully",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// POST: Add a new application
router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      jobType,
      appliedDate,
      salary,
      notes
    } = req.body;

    if (
      !companyName?.trim() ||
      !jobRole?.trim() ||
      !jobType ||
      !appliedDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Company, job role, job type and applied date are required",
        data: null
      });
    }

    if (isFutureDate(appliedDate)) {
      return res.status(400).json({
        success: false,
        message: "Applied date must be valid and cannot be in the future",
        data: null
      });
    }

    if (!["Full-time", "Internship", "Contract"].includes(jobType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job type",
        data: null
      });
    }

    const duplicate = await Application.findOne({
      companyName: {
        $regex: `^${companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
      },
      jobRole: {
        $regex: `^${jobRole.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
      },
      status: { $in: ["Applied", "Interview", "Offer"] }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "An active application for this company and role already exists",
        data: null
      });
    }

    const prefix =
      companyName.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "XXX";

    const counter = await Counter.findOneAndUpdate(
      { _id: prefix },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    const applicationId =
      `JA-${prefix}-${String(counter.sequence).padStart(3, "0")}`;

    const date = new Date(appliedDate);
    const followUpDate = new Date(date);
    followUpDate.setDate(followUpDate.getDate() + 7);

    const application = await Application.create({
      applicationId,
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      jobType,
      appliedDate: date,
      salary: salary === "" || salary == null ? null : Number(salary),
      notes: notes || "",
      status: "Applied",
      followUpDate,
      statusHistory: [{ status: "Applied" }]
    });

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// PUT: Edit application details
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "companyName",
      "jobRole",
      "jobType",
      "salary",
      "notes"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No editable fields supplied",
        data: null
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    res.json({
      success: true,
      message: "Application updated successfully",
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// PATCH: Change application status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    if (!allowedTransitions[application.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${application.status} to ${status}`,
        data: null
      });
    }

    application.status = status;
    application.statusHistory.push({ status });

    await application.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// DELETE: Delete only Applied or final-status applications
router.delete("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    if (
      !["Applied", "Rejected", "Accepted", "Declined"].includes(
        application.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Applications in Interview or Offer status cannot be deleted",
        data: null
      });
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: "Application deleted successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

module.exports = router;
