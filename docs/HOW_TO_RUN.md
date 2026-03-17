# 🚀 How to Run PaySim Platform

This guide provides step-by-step instructions to set up and run the PaySim Payment Gateway platform locally and deploy it to the cloud.

## 🛠️ Local Development Setup

The project is split into two main parts:
1. **Backend**: Express API with SQLite/Oracle DB.
2. **Frontend**: Vite + React SPA.

### 1. Prerequisites
- **Node.js**: v20.x or higher.
- **npm**: v10.x or higher.
- **Database**: SQLite (default for local) or Oracle DB.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```
   *Note: If using SQLite, ensure the `DB_TYPE` is set to `sqlite` in your config.*
4. Seed the Database (Optional):
   ```bash
   npm run seed
   ```
5. Start the Server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5001`.

### 3. Frontend Setup
1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Development Server:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:3000` (or the port shown in your terminal).

---

## ☁️ Deployment

### 1. Backend (Render)
1. Link your GitHub repository to **Render**.
2. Create a new **Web Service**.
3. Set the **Root Directory** to `backend`.
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add your `.env` variables in the Render Dashboard.

### 2. Frontend (Vercel)
1. Link your GitHub repository to **Vercel**.
2. Create a new **Project**.
3. Set the **Root Directory** to `frontend`.
4. Vercel will automatically detect the Vite build settings.
5. **Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://your-app.onrender.com/api/v1`).

---

## 📦 Project Structure Overview
- `/backend`: Express.js server, TypeORM entities, and API routes.
- `/frontend`: React components, pages, and styling (Tailwind CSS).
- `/docs`: Detailed system documentation.
- `run.sh`: Legacy script for starting the old monolithic version.
