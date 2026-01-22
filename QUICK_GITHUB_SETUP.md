# Quick GitHub Setup Guide

## ✅ What's Done
- ✅ Git repository initialized
- ✅ All files committed
- ✅ Branch renamed to `main`

## 📋 Next Steps

### 1. Create GitHub Repository

1. Go to **https://github.com**
2. Click **"+"** → **"New repository"**
3. Repository name: `producttasks`
4. Description: "PM Interview Prep Platform"
5. **Visibility:** Public or Private
6. ⚠️ **DO NOT** check any boxes (no README, .gitignore, license)
7. Click **"Create repository"**

### 2. Copy Repository URL

After creating, you'll see a page with setup instructions. Copy the HTTPS URL:
```
https://github.com/yourusername/producttasks.git
```

### 3. Connect and Push

Run these commands (replace `yourusername` with your GitHub username):

```bash
# Add remote
git remote add origin https://github.com/yourusername/producttasks.git

# Push to GitHub
git push -u origin main
```

### 4. Authenticate

When prompted:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

**To create Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Name: "ProductTasks"
4. Select: `repo` scope
5. Generate and **copy the token**
6. Use this token as password when pushing

---

## 🚀 After Pushing to GitHub

Once code is on GitHub, you can deploy to:

### Render (Recommended)
1. Go to https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Select your repository
5. Configure:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy!

### Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select repository
5. Set root directory to `backend`
6. Add environment variables
7. Auto-deploys!

---

## 📝 Files Created for Deployment

✅ `backend/Procfile` - For Render/Railway
✅ `backend/passenger_wsgi.py` - For some hosting providers
✅ `backend/runtime.txt` - Python version specification
✅ `.gitignore` - Excludes .env and cache files

---

## ⚠️ Important

- `.env` files are **NOT** pushed to GitHub (protected by .gitignore)
- You'll need to add environment variables in Render/Railway dashboard
- Never commit API keys to GitHub!

---

Ready to push! Create the GitHub repo and run the commands above. 🎉
