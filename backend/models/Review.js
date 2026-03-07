const mongoose = require("mongoose");

const aiFeedbackSchema = new mongoose.Schema(
  {
    bugs: {
      type: [String],
      default: [],
    },
    securityIssues: {
      type: [String],
      default: [],
    },
    performanceIssues: {
      type: [String],
      default: [],
    },
    codeImprovements: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectVersion",
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    aiFeedback: {
      type: aiFeedbackSchema,
      required: true,
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Review", reviewSchema);
