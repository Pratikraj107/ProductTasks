# Railway Backend Setup - Separate Service

Since Railway deployed your whole application, we need to set up the backend as a **separate service** so the frontend can connect to it.

## Current Issue
- Frontend is trying to connect to `localhost:8000` ❌
- Backend needs to be accessible at Railway URL ✅

## Solution: Create Separate Backend Service

### Step 1: Create Backend Service in Railway

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Open your "ProductTasks" project

2. **Add New Service**
   - Click **"+ New"** button
   - Select **"GitHub Repo"**
   - Choose your `ProductTasks` repository
   - Click **"Deploy Now"**

3. **Configure Backend Service**
   - Railway will detect it's a Python project
   - Go to **Settings** tab
   - Set **Root Directory** to: `backend`
   - Set **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables**
   - Go to **Variables** tab
   - Add:
     - `OPENAI_API_KEY` = your OpenAI API key
     - `FRONTEND_DOMAIN` = `producttasks.com`
     - `PORT` = (Railway sets this automatically, but you can add if needed)

5. **Generate Public Domain**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Copy the URL (e.g., `https://producttasks-backend-production-xxxx.up.railway.app`)

---

### Step 2: Update Frontend Service

1. **Go to Your Frontend Service** (the one that's already deployed)

2. **Add Environment Variable**
   - Go to **Variables** tab
   - Add:
     - `VITE_API_BASE_URL` = `https://your-backend-service-url.up.railway.app`
     - (Use the backend service URL from Step 1)

3. **Redeploy Frontend**
   - Railway should auto-redeploy when you add the variable
   - Or click **"Redeploy"** manually

---

### Step 3: Verify Setup

**Test Backend:**
```bash
curl https://your-backend-url.up.railway.app/health
```

**Test Frontend:**
- Visit your frontend URL
- Open browser console (F12)
- Check Network tab - API calls should go to Railway backend URL, not localhost

---

## Alternative: Single Service Setup

If you want to keep everything in one service, you need to:

1. **Configure Railway to serve backend at `/api` path**
   - This requires more complex routing setup
   - Not recommended for FastAPI + React setup

2. **Better: Use separate services** (recommended)
   - Frontend service: Serves React app
   - Backend service: Serves FastAPI API
   - Clear separation, easier to manage

---

## Quick Checklist

- [ ] Created separate backend service in Railway
- [ ] Set Root Directory to `backend`
- [ ] Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Added environment variables to backend service
- [ ] Generated public domain for backend service
- [ ] Added `VITE_API_BASE_URL` to frontend service
- [ ] Tested backend `/health` endpoint
- [ ] Verified frontend connects to Railway backend (not localhost)

---

## Troubleshooting

**Frontend still using localhost?**
- Make sure `VITE_API_BASE_URL` is set in Railway frontend service variables
- Rebuild/redeploy frontend after adding the variable
- Check browser console for the actual API URL being used

**CORS errors?**
- Make sure `FRONTEND_DOMAIN` is set in backend service
- Verify frontend domain matches exactly

**Backend not starting?**
- Check Railway logs for errors
- Verify `requirements.txt` is in `backend/` folder
- Make sure Root Directory is set to `backend`

---

Your backend should be accessible at: `https://your-backend-service.up.railway.app` 🚀
