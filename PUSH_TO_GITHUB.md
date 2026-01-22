# Push to GitHub - Step by Step

Your code is ready to push! Follow these steps:

---

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name:** `producttasks` (or your preferred name)
   - **Description:** "Product Management Interview Prep Platform with AI Mock Interviews"
   - **Visibility:** Public or Private (your choice)
   - ⚠️ **DO NOT** check "Initialize with README"
   - ⚠️ **DO NOT** add .gitignore or license
4. Click **"Create repository"**

---

## Step 2: Get Repository URL

After creating, GitHub will show you a page with commands. Copy the repository URL:
- It will look like: `https://github.com/yourusername/producttasks.git`
- Or: `git@github.com:yourusername/producttasks.git`

---

## Step 3: Add Remote and Push

Run these commands (replace with your actual GitHub URL):

```bash
# Add remote repository
git remote add origin https://github.com/yourusername/producttasks.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Step 4: Authentication

When you run `git push`, you'll be asked for credentials:

**Option A: Personal Access Token (Recommended)**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "ProductTasks Deployment"
4. Select scope: `repo` (full control)
5. Generate and **copy the token**
6. When pushing:
   - Username: your GitHub username
   - Password: paste the token (not your GitHub password)

**Option B: GitHub CLI**
```bash
# Install GitHub CLI if not installed
# Then authenticate
gh auth login
```

---

## Step 5: Verify Push

After pushing, refresh your GitHub repository page. You should see all your files!

---

## Step 6: Deploy to Render or Railway

Once code is on GitHub, follow the deployment guide in `GITHUB_DEPLOYMENT.md`

---

## Quick Command Reference

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your message"

# Push
git push

# For future updates
git add .
git commit -m "Update description"
git push
```

---

## Troubleshooting

**"remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/yourusername/producttasks.git
```

**"Authentication failed"**
- Use Personal Access Token instead of password
- Make sure token has `repo` scope

**"Permission denied"**
- Check repository name is correct
- Verify you have access to the repository

---

Ready to push! Create the GitHub repo first, then run the commands above. 🚀
