# Push Backend to GitHub & Deploy to Render/Railway

This guide will help you push your backend to GitHub and set up auto-deployment.

---

## Step 1: Initialize Git Repository

### If not already a git repository:

```bash
# Navigate to project root
cd C:\Users\91754\Downloads\ProductTasks_Latest-main\ProductTasks_Latest-main

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ProductTasks app with interview feedback feature"
```

---

## Step 2: Create GitHub Repository

1. **Go to GitHub**
   - Visit https://github.com
   - Sign in to your account

2. **Create New Repository**
   - Click the "+" icon → "New repository"
   - Repository name: `producttasks` (or your preferred name)
   - Description: "Product Management Interview Prep Platform"
   - Visibility: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

3. **Copy the repository URL**
   - You'll see something like: `https://github.com/yourusername/producttasks.git`

---

## Step 3: Push to GitHub

```bash
# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/producttasks.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note:** You'll need to authenticate. Use:
- Personal Access Token (recommended)
- Or GitHub CLI

---

## Step 4: Create GitHub Personal Access Token (if needed)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "ProductTasks Deployment"
4. Select scopes: `repo` (full control)
5. Generate token
6. Copy the token (you'll need it for git push)

When pushing, use token as password:
```bash
git push -u origin main
# Username: your-github-username
# Password: your-personal-access-token
```

---

## Step 5: Deploy to Render

### 5.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)

### 5.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub account (if not already)
3. Select repository: `producttasks`
4. Configure:
   - **Name:** `producttasks-api`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 5.3 Add Environment Variables
Click "Advanced" → "Add Environment Variable":
- `OPENAI_API_KEY` = `sk-your-actual-api-key-here`
- `FRONTEND_DOMAIN` = `producttasks.com`

### 5.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Your backend will be at: `https://producttasks-api.onrender.com`

### 5.5 Update Frontend
Update `.env.production`:
```
VITE_API_BASE_URL=https://producttasks-api.onrender.com
```

Rebuild frontend:
```bash
npm run build
```

---

## Step 6: Deploy to Railway (Alternative)

### 6.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### 6.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your `producttasks` repository

### 6.3 Configure Service
1. Railway will auto-detect Python
2. Click on the service → Settings
3. Set **Root Directory:** `backend`
4. Add Environment Variables:
   - `OPENAI_API_KEY` = your key
   - `FRONTEND_DOMAIN` = `producttasks.com`

### 6.4 Deploy
1. Railway will auto-deploy
2. Get your URL: `https://your-app.up.railway.app`
3. Update frontend `.env.production` with this URL

---

## Step 7: Update Backend CORS (Important!)

After deployment, update `backend/main.py` to allow your frontend domain:

The code already supports this via `FRONTEND_DOMAIN` environment variable, but make sure it's set correctly in Render/Railway.

---

## Step 8: Test Deployment

### Test Backend:
```bash
curl https://your-backend-url.onrender.com/health
# or
curl https://your-app.up.railway.app/health
```

Should return: `{"status":"healthy","agent_ready":true}`

### Test Frontend:
1. Visit `https://producttasks.com`
2. Open browser console (F12)
3. Try "Try Now" button
4. Check for any errors

---

## Quick Commands Reference

```bash
# Initialize git (if not done)
git init

# Add files
git add .

# Commit
git commit -m "Your commit message"

# Add remote (replace with your URL)
git remote add origin https://github.com/yourusername/producttasks.git

# Push to GitHub
git push -u origin main

# For future updates
git add .
git commit -m "Update message"
git push
```

---

## Auto-Deploy Setup

Both Render and Railway automatically deploy when you push to GitHub:
- Push to `main` branch → Auto-deploys
- No manual deployment needed
- Just push code and it updates!

---

## Troubleshooting

### Git Push Issues
- **Authentication failed:** Use Personal Access Token
- **Repository not found:** Check repository name and permissions

### Deployment Issues
- **Build fails:** Check `requirements.txt` is correct
- **Module not found:** Verify all files are in `backend/` folder
- **Port error:** Make sure using `$PORT` variable in start command

---

## Next Steps After Deployment

1. ✅ Backend deployed to Render/Railway
2. ✅ Get backend URL
3. ✅ Update frontend `.env.production`
4. ✅ Rebuild frontend: `npm run build`
5. ✅ Upload new `dist/` to Hostinger
6. ✅ Test everything works!

Good luck! 🚀
