const test = require("node:test");
const assert = require("node:assert/strict");
const { runHeuristicReview } = require("../services/localReviewService");

test("flags missing free with malloc as a bug", () => {
  const result = runHeuristicReview({
    fileName: "memory.c",
    language: "c",
    content: `
int main() {
  int* p = malloc(100);
  return 0;
}
`,
  });

  assert.ok(result.aiFeedback.bugs.length >= 1);
  assert.ok(result.qualityScore >= 1 && result.qualityScore <= 10);
});

test("flags unsafe APIs and command execution as security issues", () => {
  const result = runHeuristicReview({
    fileName: "unsafe.c",
    language: "c",
    content: `
int main() {
  char dst[10];
  strcpy(dst, "aaaa");
  system("ls");
  return 0;
}
`,
  });

  assert.ok(result.aiFeedback.securityIssues.length >= 2);
});

test("detects nested loops as a performance issue", () => {
  const result = runHeuristicReview({
    fileName: "perf.cpp",
    language: "cpp",
    content: `
for (int i = 0; i < n; i++) {
  for (int j = 0; j < m; j++) {
    sum += i + j;
  }
}
`,
  });

  assert.ok(result.aiFeedback.performanceIssues.length >= 1);
});

test("returns at least one improvement when no major issues are found", () => {
  const result = runHeuristicReview({
    fileName: "clean.ts",
    language: "ts",
    content: `
const value = 42;
const add = (a, b) => a + b;
export { value, add };
`,
  });

  assert.ok(result.aiFeedback.codeImprovements.length >= 1);
});
