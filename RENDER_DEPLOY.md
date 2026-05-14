# Render Deployment Notes (Single Web Service)

This project is configured to run frontend + backend in one Render Web Service using Docker.

## Service
- Type: `web`
- Runtime: `docker`
- Blueprint file: `render.yaml`
- Dockerfile: `./Dockerfile`

## What runs
- Vite frontend is built during Docker build.
- FastAPI backend serves APIs and also serves the built frontend files.
- Single public URL hosts both app UI and API.

## Important env vars
- `ALLOWED_ORIGINS=https://<your-service>.onrender.com`
- plus secrets from `backend/.env` (Supabase, etc.)

## Deploy
1. Push code to GitHub.
2. In Render, create/sync Blueprint from this repo.
3. Deploy `omni-translator-app`.
4. Open `https://<your-service>.onrender.com/health` and then root URL.
