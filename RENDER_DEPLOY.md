# Render Deployment Notes

## Backend (Web Service)
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Frontend (Static Site)
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Rewrite Rule: `/* -> /index.html`

## Required Environment Variables
- Frontend: `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com`
- Backend: `ALLOWED_ORIGINS=https://<your-frontend-service>.onrender.com`

A starter Blueprint is included at repo root as `render.yaml`.
