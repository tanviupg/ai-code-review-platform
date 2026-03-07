const OpenAI = require("openai");
const { runHeuristicReview } = require("./localReviewService");

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const parseReviewJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Invalid AI response format");
    }
    return JSON.parse(match[0]);
  }
};

const reviewCodeWithAI = async ({ fileName, language, content }) => {
  // Default to free local analysis unless explicitly enabled.
  if (process.env.USE_OPENAI_REVIEW !== "true") {
    return runHeuristicReview({ fileName, language, content });
  }

  const client = getClient();

  if (!client) {
    return runHeuristicReview({ fileName, language, content });
  }

  const prompt = `
You are a strict senior code reviewer.
Analyze the code and return JSON only using this exact schema:
{
  "bugs": ["string"],
  "securityIssues": ["string"],
  "performanceIssues": ["string"],
  "codeImprovements": ["string"],
  "summary": "string",
  "qualityScore": number
}

Rules:
- qualityScore must be integer from 1 to 10.
- Keep every list concise and actionable.
- If no issues in a category, return an empty array.

File: ${fileName}
Language: ${language}
Code:
${content}
`.trim();

  let response;
  try {
    response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      input: prompt,
    });
  } catch (error) {
    // Free fallback: if API is unavailable/quota-limited, still return useful review output.
    return runHeuristicReview({ fileName, language, content });
  }

  const raw = response.output_text || "";
  const parsed = parseReviewJson(raw);

  const qualityScore = Number(parsed.qualityScore);
  if (!Number.isInteger(qualityScore) || qualityScore < 1 || qualityScore > 10) {
    throw new Error("AI returned invalid quality score");
  }

  return {
    aiFeedback: {
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
      performanceIssues: Array.isArray(parsed.performanceIssues)
        ? parsed.performanceIssues
        : [],
      codeImprovements: Array.isArray(parsed.codeImprovements)
        ? parsed.codeImprovements
        : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    },
    qualityScore,
  };
};

module.exports = {
  reviewCodeWithAI,
};
