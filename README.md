# Task Manager

Production-ready task management app with:
- React + Vite frontend (`frontend`)
- Node.js + Express + PostgreSQL backend (`backend`)

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## 1) Backend setup

```bash
cd backend
cp .env.example .env
```

Update `backend/.env` with real values:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Then install and run migrations:

```bash
npm install
npm run migrate
```

Run backend:

```bash
npm start
```

Health checks:
- `GET /health`
- `GET /api/health`

## 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
```

Set `VITE_API_URL` in `frontend/.env` for production.
For local development, if omitted, frontend calls `/api` and uses Vite proxy.

Run frontend:

```bash
npm run dev
```

## Production checks before deploy

Backend:

```bash
cd backend
npm run check
```

Frontend:

```bash
cd frontend
npm run check
```

## Deploy notes

- Set `NODE_ENV=production` on backend.
- Ensure backend `FRONTEND_URL` exactly matches deployed frontend origin.
- Ensure frontend `VITE_API_URL` points to deployed backend `/api`.
- Keep `JWT_SECRET` strong and private.
- Do not commit `.env` files.

