const Project = require("../models/Project");
const ProjectVersion = require("../models/ProjectVersion");
const Review = require("../models/Review");
const asyncHandler = require("../utils/asyncHandler");
const { reviewCodeWithAI } = require("../services/openaiReviewService");
const { runHeuristicReview } = require("../services/localReviewService");

const reviewProjectCode = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findOne({ _id: projectId, userId: req.user._id });
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const requestedVersionId = req.query.versionId || project.currentVersionId;
  let filesSource = project.files;
  let effectiveVersionId = requestedVersionId || null;

  if (requestedVersionId) {
    const versionDoc = await ProjectVersion.findOne({
      _id: requestedVersionId,
      projectId: project._id,
      userId: req.user._id,
    });

    if (!versionDoc) {
      res.status(404);
      throw new Error("Project version not found");
    }

    filesSource = versionDoc.files || [];
    effectiveVersionId = versionDoc._id;
  }

  if (!filesSource.length) {
    res.status(400);
    throw new Error("No files found in project");
  }

  const filesToReview = filesSource.slice(0, 20);

  const reviews = await Promise.all(
    filesToReview.map(async (file) => {
      let aiResult;
      try {
        aiResult = await reviewCodeWithAI({
          fileName: file.fileName,
          language: file.language,
          content: file.content,
        });

        const improvements = aiResult?.aiFeedback?.codeImprovements || [];
        const hasQuotaFallback = improvements.some(
          (entry) =>
            typeof entry === "string" &&
            (entry.includes("AI review unavailable for") || entry.includes("429"))
        );

        if (hasQuotaFallback) {
          aiResult = runHeuristicReview({
            fileName: file.fileName,
            language: file.language,
            content: file.content,
          });
        }
      } catch (error) {
        console.warn(`Local heuristic fallback used for ${file.fileName}: ${error.message}`);
        aiResult = runHeuristicReview({
          fileName: file.fileName,
          language: file.language,
          content: file.content,
        });
      }

      return Review.create({
        projectId: project._id,
        versionId: effectiveVersionId,
        fileName: file.fileName,
        aiFeedback: aiResult.aiFeedback,
        qualityScore: aiResult.qualityScore,
      });
    })
  );

  res.status(201).json({
    success: true,
    message: "AI review completed",
    data: {
      projectId: project._id,
      reviewedFiles: reviews.length,
      reviews,
    },
  });
});

const getReviewsByProjectId = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { versionId } = req.query;

  const project = await Project.findOne({ _id: projectId, userId: req.user._id });
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const reviewFilter = { projectId };
  if (versionId) {
    reviewFilter.versionId = versionId;
  }

  const reviews = await Review.find(reviewFilter).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      projectId,
      reviews,
    },
  });
});

module.exports = {
  reviewProjectCode,
  getReviewsByProjectId,
};
