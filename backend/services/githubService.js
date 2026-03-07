const axios = require("axios");
const { isAllowedCodeFile, getLanguageFromFileName } = require("../utils/codeUtils");

const buildGitHubError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseGitHubRepoUrl = (repoUrl) => {
  const regex = /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;
  const match = repoUrl.match(regex);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return {
    owner: match[1],
    repo: match[2],
  };
};

const getGitHubHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGitHubError = (error) => {
  if (!error) return false;
  if (["ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "ECONNABORTED", "EAI_AGAIN"].includes(error.code)) {
    return true;
  }

  const status = error.response?.status;
  return status === 429 || (status >= 500 && status <= 599);
};

const requestWithRetry = async (url, requestConfig, maxRetries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await axios.get(url, requestConfig);
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableGitHubError(error)) {
        break;
      }

      const retryAfterHeader = Number(error.response?.headers?.["retry-after"]);
      const retryDelayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 500 * (2 ** attempt);

      await sleep(retryDelayMs);
    }
  }

  throw lastError;
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  const result = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      result[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return result;
};

const fetchRepoFilesFromGitHub = async (repoUrl) => {
  try {
    const { owner, repo } = parseGitHubRepoUrl(repoUrl);
    const headers = getGitHubHeaders();
    const githubTimeoutMs = Math.max(5000, Number(process.env.GITHUB_TIMEOUT_MS) || 30000);
    const githubRetries = Math.max(0, Number(process.env.GITHUB_RETRIES) || 2);
    const requestConfig = {
      headers,
      timeout: githubTimeoutMs,
    };

    const repoResponse = await requestWithRetry(
      `https://api.github.com/repos/${owner}/${repo}`,
      requestConfig,
      githubRetries
    );

    const defaultBranch = repoResponse.data.default_branch;

    const treeResponse = await requestWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      requestConfig,
      githubRetries
    );

    const codeFiles = treeResponse.data.tree.filter(
      (node) => node.type === "blob" && isAllowedCodeFile(node.path)
    );

    if (!codeFiles.length) {
      return [];
    }

    const maxFiles = Math.max(1, Number(process.env.GITHUB_MAX_FILES) || 20);
    const selectedFiles = codeFiles.slice(0, maxFiles);

    const downloadConcurrency = Math.max(1, Number(process.env.GITHUB_FILE_CONCURRENCY) || 4);
    const downloadedFiles = await mapWithConcurrency(selectedFiles, downloadConcurrency, async (fileNode) => {
      const contentResponse = await requestWithRetry(
        `https://api.github.com/repos/${owner}/${repo}/contents/${fileNode.path}?ref=${defaultBranch}`,
        requestConfig,
        githubRetries
      );

      const content = Buffer.from(contentResponse.data.content, "base64").toString(
        "utf8"
      );

      return {
        fileName: fileNode.path,
        language: getLanguageFromFileName(fileNode.path),
        content,
        size: Buffer.byteLength(content, "utf8"),
        source: "github",
        uploadedAt: new Date(),
      };
    });

    return downloadedFiles;
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      throw buildGitHubError(
        "GitHub is unreachable from this network (DNS failure). Use file upload or paste code mode.",
        503
      );
    }

    if (
      error.code === "EACCES" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET" ||
      error.code === "EAI_AGAIN"
    ) {
      throw buildGitHubError(
        "GitHub is unreachable from this network. Use file upload or paste code mode.",
        503
      );
    }

    if (error.code === "ECONNABORTED") {
      throw buildGitHubError(
        "GitHub request timed out. Please try again or use file upload/paste mode.",
        504
      );
    }

    if (error.response?.status === 404) {
      throw buildGitHubError("GitHub repository not found or is private.", 404);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw buildGitHubError(
        "GitHub access denied or rate limited. Configure GITHUB_TOKEN in backend/.env.",
        403
      );
    }

    if (error.response?.status === 429) {
      throw buildGitHubError("GitHub API rate limit exceeded. Try again later or add GITHUB_TOKEN.", 429);
    }

    throw buildGitHubError(
      error.message || "Failed to import repository from GitHub.",
      502
    );
  }
};

module.exports = {
  fetchRepoFilesFromGitHub,
};
