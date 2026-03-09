# AI Code Review Backend

## Setup

1. Install dependencies:
   `npm install`
2. Start local MongoDB (recommended for development):
   `docker compose up -d`
3. Configure environment:
   copy `.env.example` to `.env` and fill values.
4. Start server:
   `npm start`

If you use MongoDB Atlas instead of local MongoDB, update `MONGO_URI` in `.env` and make sure your current IP is whitelisted in Atlas Network Access.

## Quality Checks

- Run tests:
  `npm test`
- Run heuristic evaluation and compute accuracy metrics:
  `npm run eval:accuracy`

Evaluation report is generated at `evaluation/latest-report.json`.

## Production Notes

- Use `NODE_ENV=production`
- Set `FRONTEND_ORIGIN` to your deployed frontend URL (for CORS)
- Health endpoint: `GET /health`
- Request hardening enabled with `helmet` and rate-limiting
- Upload limits can be tuned with:
  - `MAX_UPLOAD_FILE_SIZE`
  - `MAX_UPLOAD_FILES`
  - `MAX_FORM_FIELDS`

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/signup`
- `POST /api/login`
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/paste` (body: `fileName`, `content`)
- `GET /api/projects/:id/versions`
- `GET /api/projects/:id/versions/:versionId`
- `GET /api/projects/:id/versions/compare?v1=<versionId>&v2=<versionId>`
- `POST /api/upload` (form-data: `projectId`, `files[]`)
- `POST /api/review/:projectId` (optional query: `versionId`)
- `GET /api/review/project/:projectId` (optional query: `versionId`)
- `POST /api/comments`
- `GET /api/comments/:reviewId`

Protected routes require:
`Authorization: Bearer <token>`
