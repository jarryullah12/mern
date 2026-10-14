# Deploy in 3 steps (ONE Vercel project)

This folder is the COMPLETE project: the React frontend **and** the backend API.
Deploy it as a **single** Vercel project. Then the frontend and the API live on
the same domain — so there is **no CORS** to configure and nothing to connect.

```
<this folder>/
├── api/            # Vercel serverless entry (wraps the Express app)
├── backend/        # Node + Express + MongoDB API
├── src/            # React frontend
├── public/
├── package.json
└── vercel.json
```

---

## Step 1 — push this folder to GitHub

Create a repo (or use an existing one) and push the **whole folder** — the
folder that contains `package.json`, `api/` and `backend/`.

## Step 2 — import it on Vercel

Vercel → **Add New → Project** → import the repo.

- **Framework preset:** Create React App (auto-detected)
- **Root directory:** leave as the repo root
- Build command / output directory are already set in `vercel.json`

## Step 3 — add environment variables

Project → **Settings → Environment Variables** (add for Production, and Preview
if you use it):

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | any long random string |
| `REACT_APP_API_URL` | `/api` |

Then **Deploy**.

---

## Check that it works

Open these in a browser:

- `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}`
- `https://<your-app>.vercel.app/api` → shows `"version":"1.3.0"`
- `https://<your-app>.vercel.app/api/movies` → a JSON list of movies

Then open `https://<your-app>.vercel.app` and try Register → Login.

## Seed the database (once)

Serverless can't run one-off scripts, so run the seed **from your machine**:

```
cd backend
npm install
npm run seed        # reads MONGODB_URI from backend/.env
```

Put your connection string in `backend/.env` first (copy `backend/.env.example`).
On Windows you can just double-click `backend\seed-database.bat`.

## MongoDB Atlas — allow Vercel

Atlas → **Network Access** → **Add IP Address** → **"Allow Access from
Anywhere" (`0.0.0.0/0`)**. Vercel's serverless IPs are dynamic, so a single IP
allow-list entry will not work.

---

## Notes

- Login / register are **POST** requests. Opening those URLs in a browser sends a
  **GET**, so you'll see `Route not found: GET /api/auth/login` — that is normal.
- If `/api/movies` returns `{"message":"Database connection failed"...}`, the
  `MONGODB_URI` is wrong or Atlas is not allowing Vercel (see above).
- If `/api/movies` returns `[]`, the database is connected but not seeded yet.
