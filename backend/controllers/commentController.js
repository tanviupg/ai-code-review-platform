const Comment = require("../models/Comment");
const Review = require("../models/Review");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");

const createComment = asyncHandler(async (req, res) => {
  const { reviewId, message } = req.body;

  if (!reviewId || !message) {
    res.status(400);
    throw new Error("reviewId and message are required");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const project = await Project.findOne({
    _id: review.projectId,
    userId: req.user._id,
  });
  if (!project) {
    res.status(403);
    throw new Error("Not authorized to comment on this review");
  }

  const comment = await Comment.create({
    reviewId,
    userId: req.user._id,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Comment created",
    data: comment,
  });
});

const getCommentsByReviewId = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const project = await Project.findOne({
    _id: review.projectId,
    userId: req.user._id,
  });
  if (!project) {
    res.status(403);
    throw new Error("Not authorized to view comments for this review");
  }

  const comments = await Comment.find({ reviewId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: comments,
  });
});

module.exports = {
  createComment,
  getCommentsByReviewId,
};
