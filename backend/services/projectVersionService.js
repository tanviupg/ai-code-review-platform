const ProjectVersion = require("../models/ProjectVersion");

const createVersionSnapshot = async ({ project, source, notes = "" }) => {
  const nextVersionNumber = (project.latestVersionNumber || 0) + 1;

  const version = await ProjectVersion.create({
    projectId: project._id,
    userId: project.userId,
    versionNumber: nextVersionNumber,
    source,
    notes,
    files: project.files.map((file) => ({
      fileName: file.fileName,
      language: file.language,
      content: file.content,
      size: file.size,
      source: file.source,
      uploadedAt: file.uploadedAt || new Date(),
    })),
  });

  project.currentVersionId = version._id;
  project.latestVersionNumber = nextVersionNumber;
  await project.save();

  return version;
};

module.exports = {
  createVersionSnapshot,
};
