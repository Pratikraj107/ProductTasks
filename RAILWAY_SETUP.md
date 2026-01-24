# Railway Backend Setup Guide

## How to Find Your Railway Backend URL

### Step 1: Get the URL from Railway Dashboard

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Sign in to your account

2. **Select Your Project**
   - Click on "ProductTasks" project

3. **Click on Your Service**
   - You should see a service (likely named "ProductTasks" or similar)
   - Click on it

4. **Find the URL**
   - Look for a section called **"Settings"** or **"Networking"**
   - Find **"Generate Domain"** button or **"Public Domain"** section
   - Click **"Generate Domain"** if you haven't already
   - Your URL will look like: `https://producttasks-production-xxxx.up.railway.app`
   - Or you can set a custom domain if you have one

5. **Copy the URL**
   - Copy the full URL (e.g., `https://producttasks-production-xxxx.up.railway.app`)

---

## Step 2: Test Your Backend

Test if your backend is working:

```bash
# Replace with your actual Railway URL
curl https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status":"healthy","agent_ready":true}
```

Or visit in browser:
```
https://your-railway-url.up.railway.app/health
```

---

## Step 3: Update Frontend Configuration

After getting your Railway URL, update the frontend:

1. **Create/Update `.env.production` file** in project root:
   ```
   VITE_API_BASE_URL=https://your-railway-url.up.railway.app
   ```

2. **Rebuild frontend:**
   ```bash
   npm run build
   ```

3. **Upload `dist/` folder to Hostinger**

---

## Step 4: Update Railway Environment Variables

Make sure these are set in Railway:

1. Go to Railway → Your Service → **Variables** tab
2. Add/Verify:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `FRONTEND_DOMAIN` = `producttasks.com`

---

## Step 5: Update CORS in Backend (if needed)

The backend should already handle CORS automatically via `FRONTEND_DOMAIN` environment variable, but verify:

1. In Railway, make sure `FRONTEND_DOMAIN` is set to `producttasks.com`
2. The backend will automatically allow requests from your frontend domain

---

## Quick Checklist

- [ ] Railway service is "Online"
- [ ] Generated public domain in Railway
- [ ] Copied Railway backend URL
- [ ] Tested `/health` endpoint
- [ ] Environment variables set in Railway (`OPENAI_API_KEY`, `FRONTEND_DOMAIN`)
- [ ] Updated `.env.production` with Railway URL
- [ ] Rebuilt frontend (`npm run build`)
- [ ] Uploaded new `dist/` to Hostinger

---

## Troubleshooting

### Backend not responding?
- Check Railway logs: Railway Dashboard → Your Service → **Deployments** → Click latest deployment → View logs
- Verify environment variables are set correctly
- Check if service is actually running (should show "Online")

### CORS errors?
- Make sure `FRONTEND_DOMAIN` is set in Railway
- Verify the domain matches exactly (no trailing slash)

### 404 errors?
- Make sure root directory is set to `backend` in Railway service settings
- Verify `main.py` is in the root of the backend folder

---

Your Railway backend URL is your API endpoint! 🚀
