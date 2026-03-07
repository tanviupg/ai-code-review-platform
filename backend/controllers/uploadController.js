const fs = require("fs/promises");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { getLanguageFromFileName } = require("../utils/codeUtils");
const { createVersionSnapshot } = require("../services/projectVersionService");

const uploadCodeFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400);
    throw new Error("projectId is required");
  }

  if (!req.files || !req.files.length) {
    res.status(400);
    throw new Error("At least one code file is required");
  }

  const project = await Project.findOne({ _id: projectId, userId: req.user._id });
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const uploadedFiles = await Promise.all(
    req.files.map(async (file) => {
      const content = await fs.readFile(file.path, "utf8");
      return {
        fileName: file.originalname,
        language: getLanguageFromFileName(file.originalname),
        content,
        size: file.size,
        source: "upload",
        uploadedAt: new Date(),
      };
    })
  );

  project.files.push(...uploadedFiles);

  await createVersionSnapshot({
    project,
    source: "upload",
    notes: `Uploaded ${uploadedFiles.length} file(s).`,
  });

  res.status(201).json({
    success: true,
    message: "Files uploaded successfully",
    data: {
      projectId: project._id,
      uploadedCount: uploadedFiles.length,
      versionNumber: project.latestVersionNumber,
      currentVersionId: project.currentVersionId,
      files: uploadedFiles.map((f) => ({
        fileName: f.fileName,
        language: f.language,
        size: f.size,
      })),
    },
  });
});

module.exports = {
  uploadCodeFiles,
};
