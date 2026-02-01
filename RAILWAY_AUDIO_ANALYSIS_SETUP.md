# Railway Setup Guide - Audio Analysis Feature

This guide covers setting up the backend on Railway with the new audio analysis feature that requires **ffmpeg**.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected
- OpenAI API key
- Supabase credentials (if using database)

---

## Step 1: Create/Update Backend Service

### Option A: New Backend Service

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Open your project or create a new one

2. **Add New Service**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select your `ProductTasks` repository
   - Click **"Deploy Now"**

3. **Configure Service**
   - Go to **Settings** tab
   - Set **Root Directory** to: `backend`
   - Set **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option B: Update Existing Service

1. Go to your existing backend service
2. Check **Settings** → **Root Directory** is set to `backend`
3. Verify **Start Command** is: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Step 2: Install ffmpeg (Required for Audio Analysis)

Railway uses **Nixpacks** for building. We need to install ffmpeg system dependency.

### Create `nixpacks.toml` in Backend Directory

Create a file: `backend/nixpacks.toml` with this content:

```toml
[phases.setup]
nixPkgs = ["python39", "ffmpeg"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```

**OR** use the `aptfile` method (alternative):

Create a file: `backend/Aptfile` with:
```
ffmpeg
```

Then Railway will automatically install it during build.

---

## Step 3: Environment Variables

Go to your backend service → **Variables** tab and add:

### Required Variables:
```
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_DOMAIN=your-frontend-domain.com
PORT=${{PORT}}  # Railway sets this automatically
```

### Optional (if using Supabase):
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional (if using other features):
```
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Step 4: Generate Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://producttasks-backend-production-xxxx.up.railway.app`)

---

## Step 5: Update Frontend Service

1. Go to your **Frontend Service** in Railway
2. **Variables** tab → Add:
   ```
   VITE_API_BASE_URL=https://your-backend-service-url.up.railway.app
   ```
   (Use the backend URL from Step 4)
3. **Redeploy** the frontend service

---

## Step 6: Verify Installation

### Test Backend Health:
```bash
curl https://your-backend-url.up.railway.app/health
```

### Test Audio Analysis:
1. Go to your frontend
2. Navigate to Communication Lab → Generate Script
3. Generate a script and practice reading it
4. Check if audio analysis works (should show scores and metrics)

### Check Railway Logs:
- Go to your backend service → **Deployments** → Click latest deployment → **View Logs**
- Look for any errors related to:
  - `ffmpeg` not found
  - `pydub` import errors
  - Audio loading errors

---

## Troubleshooting

### Issue: "ffmpeg not found" or "WebM conversion failed"

**Solution:**
1. Make sure `nixpacks.toml` or `Aptfile` is in the `backend/` directory
2. Redeploy the service (Railway will rebuild with ffmpeg)
3. Check build logs to confirm ffmpeg is installed

### Issue: "pydub not available"

**Solution:**
1. Check `requirements.txt` includes `pydub==0.25.1`
2. Railway should install it automatically during build
3. Check build logs for pip install errors

### Issue: Audio analysis still fails

**Solution:**
1. Check Railway logs for specific error messages
2. Verify the audio file is being sent correctly (check Network tab in browser)
3. Test with a shorter audio recording first
4. Check if OpenAI API key is valid and has credits

### Issue: Build fails

**Solution:**
1. Check Railway build logs
2. Verify `requirements.txt` is in `backend/` directory
3. Make sure Root Directory is set to `backend`
4. Check for Python version compatibility (Railway uses Python 3.9+)

---

## Alternative: Using Dockerfile (If Nixpacks doesn't work)

If Nixpacks configuration doesn't work, create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE $PORT

# Start server
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
```

Then in Railway:
- Go to **Settings** → **Build**
- Set **Dockerfile Path** to: `backend/Dockerfile`

---

## Quick Checklist

- [ ] Created/updated backend service in Railway
- [ ] Set Root Directory to `backend`
- [ ] Created `backend/nixpacks.toml` or `backend/Aptfile` for ffmpeg
- [ ] Added all required environment variables
- [ ] Generated public domain for backend
- [ ] Updated frontend `VITE_API_BASE_URL`
- [ ] Tested `/health` endpoint
- [ ] Tested audio analysis feature
- [ ] Verified Railway logs show no errors

---

## File Structure

Your `backend/` directory should have:
```
backend/
├── nixpacks.toml      # OR Aptfile (for ffmpeg)
├── requirements.txt   # Includes pydub
├── main.py
├── Procfile
└── ... (other files)
```

---

## Cost Considerations

- **ffmpeg**: Free, no additional cost
- **pydub**: Free Python library
- **Audio Analysis**: Uses OpenAI Whisper API (costs apply)
- **Railway**: Check your Railway plan for compute/storage limits

---

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Check browser console for frontend errors
3. Test backend endpoints directly with curl/Postman
4. Verify all environment variables are set correctly

Your backend should now support audio analysis! 🎤✨
