const path = require("path");

const ALLOWED_EXTENSIONS = [
  ".js",
  ".ts",
  ".tsx",
  ".py",
  ".go",
  ".java",
  ".rb",
  ".rs",
  ".cpp",
  ".c",
  ".h",
];

const extensionToLanguage = {
  ".js": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".py": "Python",
  ".go": "Go",
  ".java": "Java",
  ".rb": "Ruby",
  ".rs": "Rust",
  ".cpp": "C++",
  ".c": "C",
  ".h": "C/C++ Header",
};

const isAllowedCodeFile = (fileName) => {
  const extension = path.extname(fileName || "").toLowerCase();
  return ALLOWED_EXTENSIONS.includes(extension);
};

const getLanguageFromFileName = (fileName) => {
  const extension = path.extname(fileName || "").toLowerCase();
  return extensionToLanguage[extension] || "Unknown";
};

const getLanguageFromContent = (content = "") => {
  const snippet = String(content);

  if (/^\s*#include\s+[<"].+[>"]/m.test(snippet)) return "C++";
  if (/^\s*package\s+main/m.test(snippet) || /\bfunc\s+\w+\s*\(/m.test(snippet)) return "Go";
  if (/\bdef\s+\w+\s*\(/m.test(snippet) || /^\s*import\s+\w+/m.test(snippet)) return "Python";
  if (/\bfn\s+\w+\s*\(/m.test(snippet) || /\blet\s+mut\s+\w+/m.test(snippet)) return "Rust";
  if (/\bpublic\s+class\s+\w+/m.test(snippet) || /\bSystem\.out\.println\(/m.test(snippet)) return "Java";
  if (/\binterface\s+\w+\s*{/m.test(snippet) || /:\s*(string|number|boolean)\b/m.test(snippet)) return "TypeScript";
  if (/\bfunction\s+\w+\s*\(/m.test(snippet) || /\bconst\s+\w+\s*=\s*\(/m.test(snippet)) return "JavaScript";

  return "Unknown";
};

module.exports = {
  ALLOWED_EXTENSIONS,
  isAllowedCodeFile,
  getLanguageFromFileName,
  getLanguageFromContent,
};
