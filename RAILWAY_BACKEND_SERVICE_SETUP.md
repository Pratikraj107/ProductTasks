# Railway Backend Service Setup - Step by Step

## Step 1: Create Separate Backend Service

### In Railway Dashboard:

1. **Go to Your Project**
   - Open "ProductTasks" project in Railway

2. **Add New Service**
   - Click the **"+ New"** button (top right or in the project view)
   - Select **"GitHub Repo"**
   - Choose your `Pratikraj107/ProductTasks` repository
   - Click **"Deploy Now"**

3. **Rename the Service** (optional but recommended)
   - Click on the service name
   - Rename it to: `producttasks-backend` or `backend`

---

## Step 2: Configure Backend Service

### A. Set Root Directory

1. Go to **Settings** tab
2. Scroll to **"Root Directory"** section
3. Set it to: `backend`
4. Click **"Save"**

### B. Set Start Command

1. In **Settings** tab
2. Scroll to **"Start Command"** section
3. Set it to: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **"Save"**

### C. Configure Healthcheck

1. In **Settings** tab
2. Scroll to **"Healthcheck Path"** section
3. Enter: `/health`
4. Click **"Save"**

This tells Railway to check `/health` endpoint before marking deployment as successful.

---

## Step 3: Add Environment Variables

1. Go to **Variables** tab
2. Click **"+ New Variable"**
3. Add these variables:

   **Required:**
   - `OPENAI_API_KEY` = `sk-your-actual-openai-api-key`
   - `FRONTEND_DOMAIN` = `producttasks.com` (your main domain)
   - `RAILWAY_FRONTEND_DOMAIN` = `https://producttasks-production.up.railway.app`

   **Optional (for CORS):**
   - `ALLOWED_ORIGINS` = `https://producttasks-production.up.railway.app,https://producttasks.com`

---

## Step 4: Generate Public Domain for Backend

1. Go to **Settings** tab
2. Scroll to **"Public Networking"** section
3. Click **"Generate Domain"** button
4. Railway will create a domain like: `producttasks-backend-production-xxxx.up.railway.app`
5. **Copy this URL** - this is your backend API URL!

---

## Step 5: Update Frontend Service

Now update your frontend service to use the backend URL:

1. **Go to your Frontend Service** (the one showing `producttasks-production.up.railway.app`)

2. **Add Environment Variable:**
   - Go to **Variables** tab
   - Click **"+ New Variable"**
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-domain.up.railway.app` (use the backend URL from Step 4)
   - Click **"Save"**

3. **Redeploy Frontend:**
   - Railway will auto-redeploy when you add the variable
   - Or go to **Deployments** tab → Click **"Redeploy"**

---

## Step 6: Verify Everything Works

### Test Backend:
```bash
curl https://your-backend-url.up.railway.app/health
```

Should return:
```json
{"status":"healthy","agent_ready":true}
```

### Test Frontend:
1. Visit: `https://producttasks-production.up.railway.app`
2. Open browser console (F12)
3. Go to **Network** tab
4. Try the mock interview feature
5. Check that API calls go to your backend Railway URL (not localhost)

---

## Summary

**Frontend Service:**
- Domain: `producttasks-production.up.railway.app`
- Root Directory: (root of repo, or leave empty)
- Environment Variable: `VITE_API_BASE_URL` = backend URL

**Backend Service:**
- Domain: `producttasks-backend-production-xxxx.up.railway.app` (generated)
- Root Directory: `backend`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Healthcheck Path: `/health`
- Environment Variables: `OPENAI_API_KEY`, `FRONTEND_DOMAIN`, `RAILWAY_FRONTEND_DOMAIN`

---

## Troubleshooting

**Backend not starting?**
- Check Railway logs: Go to **Deployments** → Click latest → View logs
- Verify Root Directory is set to `backend`
- Verify Start Command is correct

**Healthcheck failing?**
- Make sure healthcheck path is `/health` (not `/health/` with trailing slash)
- Check backend logs to see if `/health` endpoint is responding

**Frontend still using localhost?**
- Make sure `VITE_API_BASE_URL` is set in frontend service variables
- Rebuild/redeploy frontend after adding the variable
- Clear browser cache

**CORS errors?**
- Verify `FRONTEND_DOMAIN` and `RAILWAY_FRONTEND_DOMAIN` are set in backend
- Check that frontend URL matches exactly

---

You're all set! 🚀
