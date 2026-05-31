# FileFlip 🔄

A full-stack file conversion web app. Convert **PDF → Word (DOCX)** and **Word → PDF** instantly. Built with React + Vite (frontend), Node.js + Express (backend), and Supabase (auth + database + storage).

---

## Features

- 🔐 User authentication (register/login/logout) via Supabase Auth
- 📄 PDF → Word (DOCX) conversion
- 📝 Word (DOCX) → PDF conversion
- 📊 Conversion history stored in Supabase (per user, RLS protected)
- ☁️ File storage in Supabase Storage
- 🎨 Dark navy UI with Tailwind CSS

---

## Project Structure

```
fileflip/
├── backend/              # Node.js + Express API
│   ├── middleware/
│   │   └── auth.js       # Supabase JWT verification
│   ├── routes/
│   │   └── convert.js    # Conversion endpoints
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.jsx
│   │   │   ├── ConversionHistory.jsx
│   │   │   └── Navbar.jsx
│   │   ├── lib/
│   │   │   └── supabaseClient.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── render.yaml           # Render deployment config
├── supabase_setup.sql    # DB schema + RLS setup
└── README.md
```

---

## 1. Supabase Setup

### a) Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **API keys** (anon + service_role)

### b) Disable email confirmation (for easier testing)
- Dashboard → Authentication → Providers → Email → Disable "Confirm email"

### c) Run the SQL schema
- Dashboard → SQL Editor → paste the contents of `supabase_setup.sql` → Run

### d) Create storage bucket
- Dashboard → Storage → New bucket
  - Name: `fileflip-files`
  - Public: **off**

---

## 2. Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev        # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase credentials + backend URL in .env
npm install
npm run dev        # runs on http://localhost:5173
```

**Note:** LibreOffice must be installed locally for DOCX→PDF conversion:
- Ubuntu/Debian: `sudo apt-get install libreoffice`
- macOS: `brew install libreoffice`

---

## 3. Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `FRONTEND_URL` | Your frontend URL (for CORS) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_BACKEND_URL` | Your backend URL |

---

## 4. Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render will detect `render.yaml`
4. It will create **two services**: `fileflip-backend` and `fileflip-frontend`
5. Set environment variables for each service in the Render dashboard:

**Backend service env vars:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` → your frontend Render URL (e.g. `https://fileflip-frontend.onrender.com`)

**Frontend service env vars:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL` → your backend Render URL (e.g. `https://fileflip-backend.onrender.com`)

> ⚠️ LibreOffice is automatically installed during the backend build via `render.yaml`.

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/convert/pdf-to-docx` | Convert PDF → DOCX |
| POST | `/api/convert/docx-to-pdf` | Convert DOCX → PDF |

All conversion endpoints require `Authorization: Bearer <supabase_access_token>` header.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, Multer |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| PDF → DOCX | pdf-parse + docx |
| DOCX → PDF | LibreOffice (libreoffice-convert) |
| Deployment | Render |
