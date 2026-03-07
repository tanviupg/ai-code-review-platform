const Project = require("../models/Project");
const ProjectVersion = require("../models/ProjectVersion");
const asyncHandler = require("../utils/asyncHandler");

const ensureProjectAccess = async ({ projectId, userId }) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
  return project;
};

const listProjectVersions = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const project = await ensureProjectAccess({ projectId, userId: req.user._id });

  const versions = await ProjectVersion.find({ projectId, userId: req.user._id })
    .select("versionNumber source notes files createdAt")
    .sort({ versionNumber: -1 });

  res.json({
    success: true,
    data: {
      projectId: project._id,
      currentVersionId: project.currentVersionId,
      latestVersionNumber: project.latestVersionNumber,
      versions: versions.map((version) => ({
        id: version._id,
        versionNumber: version.versionNumber,
        source: version.source,
        notes: version.notes,
        fileCount: version.files.length,
        createdAt: version.createdAt,
      })),
    },
  });
});

const getProjectVersionById = asyncHandler(async (req, res) => {
  const { id: projectId, versionId } = req.params;
  await ensureProjectAccess({ projectId, userId: req.user._id });

  const version = await ProjectVersion.findOne({
    _id: versionId,
    projectId,
    userId: req.user._id,
  });

  if (!version) {
    res.status(404);
    throw new Error("Project version not found");
  }

  res.json({
    success: true,
    data: {
      id: version._id,
      projectId: version.projectId,
      versionNumber: version.versionNumber,
      source: version.source,
      notes: version.notes,
      files: version.files,
      createdAt: version.createdAt,
    },
  });
});

const compareProjectVersions = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const { v1, v2 } = req.query;

  if (!v1 || !v2) {
    res.status(400);
    throw new Error("v1 and v2 query params are required");
  }

  await ensureProjectAccess({ projectId, userId: req.user._id });

  const versions = await ProjectVersion.find({
    _id: { $in: [v1, v2] },
    projectId,
    userId: req.user._id,
  });

  if (versions.length !== 2) {
    res.status(404);
    throw new Error("One or both versions not found");
  }

  const versionA = versions.find((v) => String(v._id) === String(v1));
  const versionB = versions.find((v) => String(v._id) === String(v2));

  const aFiles = new Set(versionA.files.map((file) => file.fileName));
  const bFiles = new Set(versionB.files.map((file) => file.fileName));

  const added = [...bFiles].filter((fileName) => !aFiles.has(fileName));
  const removed = [...aFiles].filter((fileName) => !bFiles.has(fileName));
  const common = [...aFiles].filter((fileName) => bFiles.has(fileName));
  const changed = common.filter((fileName) => {
    const fileA = versionA.files.find((file) => file.fileName === fileName);
    const fileB = versionB.files.find((file) => file.fileName === fileName);
    return fileA.content !== fileB.content;
  });

  res.json({
    success: true,
    data: {
      projectId,
      baseVersion: { id: versionA._id, versionNumber: versionA.versionNumber },
      targetVersion: { id: versionB._id, versionNumber: versionB.versionNumber },
      diff: {
        added,
        removed,
        changed,
      },
    },
  });
});

module.exports = {
  listProjectVersions,
  getProjectVersionById,
  compareProjectVersions,
};
