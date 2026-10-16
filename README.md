# MediCare+ | Smart Healthcare & Telemedicine Platform

A full-stack intelligent healthcare application featuring doctor recommendations, appointment scheduling, real-time WebRTC video consultations with live chat, digital prescriptions, consultation fee payments, and complete patient medical records.

---

## 🚀 Live Cloud Deployment Guide

This project is decoupled into a **Node.js Express + Socket.IO Backend** and a **Vite + React Frontend**. Follow the steps below for free cloud deployment:

### Step 1: Deploy Backend (Render Web Service)
1. Go to [Render.com](https://render.com) and create an account or sign in.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository: `https://github.com/vineethjr/medicare-plus.git`.
4. Fill in the following deployment settings:
   - **Name**: `medicare-backend` (or any custom name)
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `PORT` = `5000` (Render sets its own port automatically, but good to have)
   - `JWT_SECRET` = `your_strong_secret_key_here`
   - `CLIENT_URL` = (Leave blank initially, you will set this to your frontend URL after Step 2)
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://medicare-backend.onrender.com`).

---

### Step 2: Deploy Frontend (Vercel or Render Static Site)

#### Option A: Vercel (Recommended for Frontend)
1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import `medicare-plus`.
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables**:
   - `VITE_BACKEND_URL` = `https://medicare-backend.onrender.com` (use your Render backend URL from Step 1, without trailing slash)
6. Click **Deploy**.

#### Option B: Render Static Site
1. On Render, click **New +** > **Static Site**.
2. Select the repository.
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - `VITE_BACKEND_URL` = `https://medicare-backend.onrender.com`
5. In **Redirects / Rewrites**, add:
   - Source: `/*` -> Destination: `/index.html` -> Action: `Rewrite`
6. Click **Create Static Site**.

---

### Step 3: Connect Frontend URL to Backend
1. Once your frontend is deployed, copy its URL (e.g., `https://medicare-plus.vercel.app`).
2. Go back to your Render backend service -> **Environment**.
3. Add or update `CLIENT_URL` with your frontend URL (e.g., `https://medicare-plus.vercel.app`).
4. Save changes. Render will redeploy automatically with full CORS and WebRTC / Socket.IO authorization.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
# Server runs at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, React Router 7, Socket.IO Client, Pure CSS with Cyber-Clinical Obsidian Dark Theme.
- **Backend**: Node.js, Express 5, Better-SQLite3, Socket.IO, JWT, BcryptJS.
- **Real-Time Communication**: WebRTC P2P Video with STUN fallback & Socket.IO signaling.
