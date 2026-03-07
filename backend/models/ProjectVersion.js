const mongoose = require("mongoose");

const versionFileSchema = new mongoose.Schema(
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

const projectVersionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    source: {
      type: String,
      enum: ["upload", "github", "paste"],
      required: true,
    },
    files: {
      type: [versionFileSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

projectVersionSchema.index({ projectId: 1, versionNumber: -1 }, { unique: true });

module.exports = mongoose.model("ProjectVersion", projectVersionSchema);
