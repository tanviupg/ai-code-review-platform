export interface Project {
  id: string;
  name: string;
  language: string;
  lastReview: string;
  score: number;
  issues: number;
  status: "reviewed" | "pending" | "in-progress";
}

export interface ReviewIssue {
  id: string;
  type: "bug" | "security" | "performance" | "improvement";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  suggestion?: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  lineNumber?: number;
}

export const mockProjects: Project[] = [
  { id: "1", name: "auth-service", language: "TypeScript", lastReview: "2 hours ago", score: 82, issues: 5, status: "reviewed" },
  { id: "2", name: "payment-gateway", language: "Python", lastReview: "1 day ago", score: 67, issues: 12, status: "reviewed" },
  { id: "3", name: "user-dashboard", language: "React", lastReview: "3 days ago", score: 91, issues: 2, status: "reviewed" },
  { id: "4", name: "data-pipeline", language: "Go", lastReview: "Just now", score: 0, issues: 0, status: "in-progress" },
];

export const mockCode = `import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

const SECRET = "hardcoded-secret-key-123"; // TODO: use env var

const users = [];

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // No input validation
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, password: hashedPassword });
  
  res.json({ message: "User registered" });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = jwt.sign({ email }, SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/profile', (req, res) => {
  const token = req.headers.authorization;
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ user: decoded });
  } catch(e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(3000, () => console.log('Server running'));`;

export const mockIssues: ReviewIssue[] = [
  {
    id: "1",
    type: "security",
    severity: "high",
    title: "Hardcoded JWT Secret",
    description: "The JWT secret key is hardcoded in the source code. This is a critical security vulnerability that could allow attackers to forge tokens.",
    lineStart: 8,
    lineEnd: 8,
    suggestion: 'Use environment variables: const SECRET = process.env.JWT_SECRET;',
  },
  {
    id: "2",
    type: "bug",
    severity: "medium",
    title: "Missing Input Validation",
    description: "The /register endpoint does not validate email format or password strength before processing.",
    lineStart: 13,
    lineEnd: 14,
    suggestion: "Add input validation using a library like Joi or express-validator.",
  },
  {
    id: "3",
    type: "security",
    severity: "high",
    title: "No Rate Limiting",
    description: "The login endpoint has no rate limiting, making it vulnerable to brute-force attacks.",
    lineStart: 21,
    lineEnd: 21,
    suggestion: "Implement rate limiting using express-rate-limit middleware.",
  },
  {
    id: "4",
    type: "performance",
    severity: "low",
    title: "In-Memory User Storage",
    description: "Users are stored in an in-memory array which won't persist across restarts and doesn't scale.",
    lineStart: 10,
    lineEnd: 10,
    suggestion: "Use a proper database like PostgreSQL or MongoDB.",
  },
  {
    id: "5",
    type: "improvement",
    severity: "medium",
    title: "Missing Error Handling",
    description: "No global error handler. Unhandled errors could crash the server or leak sensitive info.",
    lineStart: 43,
    lineEnd: 47,
    suggestion: "Add a global error handling middleware and wrap async handlers.",
  },
];

export const mockComments: Comment[] = [
  {
    id: "1",
    author: "Sarah Chen",
    content: "Good catch on the hardcoded secret. We should also consider using RS256 instead of HS256 for better security.",
    timestamp: "2 hours ago",
    lineNumber: 8,
  },
  {
    id: "2",
    author: "Mike Torres",
    content: "Agreed on the rate limiting. I'd suggest using a sliding window approach with Redis for distributed rate limiting.",
    timestamp: "1 hour ago",
    lineNumber: 21,
  },
  {
    id: "3",
    author: "Alex Kim",
    content: "The input validation is crucial. We should validate both email format and enforce a minimum password complexity policy.",
    timestamp: "45 minutes ago",
  },
];
