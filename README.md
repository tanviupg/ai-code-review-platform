# AI Code Review Platform

AI-powered developer platform that analyzes uploaded code or GitHub repositories, detects bugs, security issues, and best-practice violations, and generates automated code reviews with quality scoring.

## Architecture

- `backend`: Node.js + Express + MongoDB API
- `frontend`: React + Vite web app

## Local Development

1. Backend
   - `cd backend`
   - `npm install`
   - Copy `.env.example` to `.env` and fill values
   - `npm start`
2. Frontend
   - `cd frontend`
   - `npm install`
   - Copy `.env.example` to `.env`
   - `npm run dev`

## Deploy To Render

You can deploy using either:

- Manual setup in Render dashboard (recommended first deploy)
- `render.yaml` blueprint in this repository

### Backend (Web Service)

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Required env vars:

- `NODE_ENV=production`
- `MONGO_URI=<mongodb-atlas-uri>`
- `JWT_SECRET=<strong-random-secret>`
- `FRONTEND_ORIGIN=<https://your-frontend.onrender.com>`

Optional:

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4.1-mini`
- `USE_OPENAI_REVIEW=false`
- `GITHUB_TOKEN`

### Frontend (Static Site)

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Env vars:

- `VITE_API_BASE_URL=https://<your-backend>.onrender.com/api`

## CI

GitHub Actions workflow runs:

- Backend `npm test`
- Frontend `npm run lint`
- Frontend `npm run build`
