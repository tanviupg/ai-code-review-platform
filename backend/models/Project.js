const mongoose = require("mongoose");

const projectFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ["upload", "github", "paste"],
      default: "upload",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    repoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    files: {
      type: [projectFileSchema],
      default: [],
    },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectVersion",
      default: null,
    },
    latestVersionNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Project", projectSchema);
