const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { fetchRepoFilesFromGitHub } = require("../services/githubService");
const { createVersionSnapshot } = require("../services/projectVersionService");
const { getLanguageFromFileName, getLanguageFromContent } = require("../utils/codeUtils");

const createProject = asyncHandler(async (req, res) => {
  const { name, repoUrl } = req.body;

  if (!name || !String(name).trim()) {
    res.status(400);
    throw new Error("Project name is required");
  }

  let files = [];

  if (repoUrl) {
    files = await fetchRepoFilesFromGitHub(repoUrl);
  }

  const project = await Project.create({
    name: String(name).trim(),
    userId: req.user._id,
    repoUrl: repoUrl || null,
    files,
  });

  if (project.files.length > 0) {
    await createVersionSnapshot({
      project,
      source: repoUrl ? "github" : "upload",
      notes: repoUrl
        ? "Initial version imported from GitHub."
        : "Initial project version created.",
    });
  }

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: projects,
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.json({
    success: true,
    data: project,
  });
});

const pasteCodeToProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fileName, content } = req.body;

  if (!fileName || !String(fileName).trim()) {
    res.status(400);
    throw new Error("fileName is required");
  }

  if (!content || !String(content).trim()) {
    res.status(400);
    throw new Error("content is required");
  }

  const project = await Project.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const normalizedFileName = String(fileName).trim();
  const normalizedContent = String(content);
  const language = getLanguageFromFileName(normalizedFileName) === "Unknown"
    ? getLanguageFromContent(normalizedContent)
    : getLanguageFromFileName(normalizedFileName);

  const nextFile = {
    fileName: normalizedFileName,
    language,
    content: normalizedContent,
    size: Buffer.byteLength(normalizedContent, "utf8"),
    source: "paste",
    uploadedAt: new Date(),
  };

  const existingIdx = project.files.findIndex((f) => f.fileName === normalizedFileName);
  if (existingIdx >= 0) {
    project.files[existingIdx] = nextFile;
  } else {
    project.files.push(nextFile);
  }

  await createVersionSnapshot({
    project,
    source: "paste",
    notes: `Code pasted for ${normalizedFileName}.`,
  });

  res.status(201).json({
    success: true,
    message: "Pasted code saved successfully",
    data: {
      projectId: project._id,
      file: {
        fileName: nextFile.fileName,
        language: nextFile.language,
        size: nextFile.size,
      },
      versionNumber: project.latestVersionNumber,
      currentVersionId: project.currentVersionId,
    },
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  pasteCodeToProject,
};
