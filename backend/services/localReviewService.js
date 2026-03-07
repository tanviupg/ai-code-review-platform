const computeQualityScore = (counts) => {
  const penalty =
    counts.security * 2.0 +
    counts.bugs * 1.5 +
    counts.performance * 1.0 +
    counts.improvements * 0.5;

  const score = Math.round(Math.max(1, Math.min(10, 10 - penalty)));
  return score;
};

const has = (content, regex) => regex.test(content);

const runHeuristicReview = ({ fileName, language, content }) => {
  const text = String(content || "");
  const bugs = [];
  const securityIssues = [];
  const performanceIssues = [];
  const codeImprovements = [];

  if (has(text, /\bmalloc\s*\(/) && !has(text, /\bfree\s*\(/)) {
    bugs.push("Potential memory leak: malloc detected without matching free.");
  }

  if (has(text, /\bnew\s+\w+/) && !has(text, /\bdelete\b/)) {
    bugs.push("Potential memory leak: new detected without delete.");
  }

  if (has(text, /\bstrcpy\s*\(/) || has(text, /\bgets\s*\(/)) {
    securityIssues.push("Unsafe string function detected (strcpy/gets). Prefer bounded alternatives.");
  }

  if (has(text, /\bsystem\s*\(/)) {
    securityIssues.push("system() call detected; command execution can be unsafe.");
  }

  if (has(text, /\busing\s+namespace\s+std\s*;/)) {
    codeImprovements.push("Avoid `using namespace std;` in larger codebases to prevent name collisions.");
  }

  if (has(text, /\bfor\s*\(.*\)\s*{?[\s\S]{0,300}\bfor\s*\(/m)) {
    performanceIssues.push("Nested loops detected; verify complexity on large inputs.");
  }

  if (has(text, /std::endl/gm)) {
    performanceIssues.push("Frequent `std::endl` flushes output stream; prefer `\\n` where possible.");
  }

  if (!has(text, /\bconst\b/) && has(text, /\b(int|float|double|string|char)\b/)) {
    codeImprovements.push("Consider using `const` for values that do not change.");
  }

  if (!has(text, /\btry\b/) && has(text, /\bthrow\b/)) {
    bugs.push("`throw` detected without visible error handling nearby.");
  }

  if (text.length < 40) {
    codeImprovements.push("Very short file; review may be limited until more code is provided.");
  }

  if (
    bugs.length === 0 &&
    securityIssues.length === 0 &&
    performanceIssues.length === 0 &&
    codeImprovements.length === 0
  ) {
    codeImprovements.push("No obvious issues found by local heuristic checks.");
  }

  const qualityScore = computeQualityScore({
    bugs: bugs.length,
    security: securityIssues.length,
    performance: performanceIssues.length,
    improvements: codeImprovements.length,
  });

  return {
    aiFeedback: {
      bugs,
      securityIssues,
      performanceIssues,
      codeImprovements,
      summary: `Local heuristic review generated for ${fileName} (${language}).`,
    },
    qualityScore,
  };
};

module.exports = {
  runHeuristicReview,
};
