const fs = require("fs");
const path = require("path");
const { runHeuristicReview } = require("../services/localReviewService");

const DATASET_PATH = path.join(__dirname, "..", "evaluation", "dataset.json");
const REPORT_PATH = path.join(__dirname, "..", "evaluation", "latest-report.json");
const LABELS = ["bugs", "securityIssues", "performanceIssues", "codeImprovements"];

const percent = (value) => Number((value * 100).toFixed(2));

const initConfusion = () => ({ tp: 0, tn: 0, fp: 0, fn: 0 });

const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
const confusionByLabel = Object.fromEntries(LABELS.map((label) => [label, initConfusion()]));
const sampleResults = [];

let totalPredictions = 0;
let correctPredictions = 0;

for (const sample of dataset) {
  const result = runHeuristicReview({
    fileName: sample.fileName,
    language: sample.language,
    content: sample.content,
  });

  const predicted = {
    bugs: result.aiFeedback.bugs.length > 0,
    securityIssues: result.aiFeedback.securityIssues.length > 0,
    performanceIssues: result.aiFeedback.performanceIssues.length > 0,
    codeImprovements: result.aiFeedback.codeImprovements.length > 0,
  };

  let exactMatch = true;

  for (const label of LABELS) {
    const expected = Boolean(sample.expected[label]);
    const actual = Boolean(predicted[label]);
    totalPredictions += 1;

    if (actual === expected) {
      correctPredictions += 1;
    } else {
      exactMatch = false;
    }

    const confusion = confusionByLabel[label];
    if (expected && actual) confusion.tp += 1;
    if (!expected && !actual) confusion.tn += 1;
    if (!expected && actual) confusion.fp += 1;
    if (expected && !actual) confusion.fn += 1;
  }

  sampleResults.push({
    id: sample.id,
    exactMatch,
    expected: sample.expected,
    predicted,
    qualityScore: result.qualityScore,
  });
}

const metricsByLabel = {};
for (const label of LABELS) {
  const { tp, tn, fp, fn } = confusionByLabel[label];
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / (tp + tn + fp + fn);

  metricsByLabel[label] = {
    confusion: confusionByLabel[label],
    precision: percent(precision),
    recall: percent(recall),
    f1: percent(f1),
    accuracy: percent(accuracy),
  };
}

const exactMatchCount = sampleResults.filter((item) => item.exactMatch).length;
const overallAccuracy = correctPredictions / totalPredictions;
const exactMatchAccuracy = exactMatchCount / sampleResults.length;

const report = {
  evaluatedAt: new Date().toISOString(),
  datasetSize: dataset.length,
  overallAccuracy: percent(overallAccuracy),
  exactMatchAccuracy: percent(exactMatchAccuracy),
  metricsByLabel,
  sampleResults,
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Dataset size: ${report.datasetSize}`);
console.log(`Overall accuracy: ${report.overallAccuracy}%`);
console.log(`Exact match accuracy: ${report.exactMatchAccuracy}%`);
console.log(`Report written to: ${REPORT_PATH}`);
