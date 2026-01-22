# Backend Upload Guide for Hostinger

## ✅ What to Upload

Upload the **entire `backend/` folder** directly to Hostinger. No build step needed!

### Files to Upload:
```
backend/
├── main.py                    ✅ Upload
├── requirements.txt           ✅ Upload
├── .env                       ✅ Upload (with your API key)
├── agents/
│   ├── interview_feedback.py  ✅ Upload
│   └── resume_reviewer.py    ✅ Upload
└── passenger_wsgi.py          ✅ Upload (create this if needed)
```

### Files to EXCLUDE (don't upload):
```
backend/
├── __pycache__/              ❌ Don't upload (Python cache)
├── *.pyc                      ❌ Don't upload (compiled Python)
└── venv/                      ❌ Don't upload (virtual environment)
```

---

## 📤 Upload Process

### Step 1: Prepare Backend Folder

1. **Make sure `.env` file exists** in `backend/` folder:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   FRONTEND_DOMAIN=producttasks.com
   ```

2. **Create `passenger_wsgi.py`** in `backend/` folder (if using Python hosting):
   ```python
   import sys
   import os
   
   sys.path.insert(0, os.path.dirname(__file__))
   
   from main import app
   application = app
   ```

### Step 2: Upload to Hostinger

**Option A: Via File Manager**
1. Go to Hostinger File Manager
2. Navigate to: `/home/u351565913/domains/producttasks.com/public_html/backend`
3. Upload all files from your local `backend/` folder:
   - `main.py`
   - `requirements.txt`
   - `.env`
   - `agents/` folder (with all Python files)
   - `passenger_wsgi.py` (if created)

**Option B: Via FTP/SFTP**
1. Connect to Hostinger FTP
2. Navigate to `public_html/backend/`
3. Upload all backend files

**Option C: Compress and Upload**
```bash
# On your local machine
cd backend
# Create zip file (exclude cache and venv)
zip -r backend.zip . -x "__pycache__/*" -x "*.pyc" -x "venv/*"
```
Then upload `backend.zip` and extract it on Hostinger.

### Step 3: Install Dependencies on Server

After uploading, you need to install Python packages on the server:

**Via Hostinger Terminal/SSH:**
```bash
cd /home/u351565913/domains/producttasks.com/public_html/backend
pip install -r requirements.txt
```

**Or via Python App interface:**
- Hostinger Python App usually installs dependencies automatically
- Or use the terminal in Python App settings

### Step 4: Configure Python App

1. Go to Hostinger → Python App
2. Create/Edit Python application
3. Set:
   - **Application Root:** `/home/u351565913/domains/producttasks.com/public_html/backend`
   - **Startup File:** `passenger_wsgi.py` or `main.py`
   - **Python Version:** 3.11 or 3.12
4. Add Environment Variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `FRONTEND_DOMAIN` = producttasks.com

### Step 5: Start the Application

- If using Python App: It should start automatically
- If using VPS: Set up systemd service (see full deployment guide)

---

## 🔍 Key Differences: Frontend vs Backend

| Aspect | Frontend (React/Vite) | Backend (FastAPI) |
|--------|----------------------|-------------------|
| Build Required? | ✅ Yes (`npm run build`) | ❌ No |
| Upload What? | `dist/` folder contents | `backend/` folder contents |
| Source Files? | ❌ Don't upload | ✅ Upload directly |
| Dependencies? | Built into `dist/` | Install on server with `pip` |

---

## ✅ Quick Checklist

- [ ] `.env` file created in `backend/` with API key
- [ ] `passenger_wsgi.py` created (if needed)
- [ ] All backend files uploaded to Hostinger
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Python App configured
- [ ] Environment variables set
- [ ] Backend tested: `https://api.producttasks.com/health`

---

## 🚨 Important Notes

1. **No Build Step:** Python runs source code directly, no compilation needed
2. **Upload Source Files:** Upload `.py` files, not compiled versions
3. **Install Dependencies:** Must run `pip install -r requirements.txt` on server
4. **Environment Variables:** Set in Python App settings or `.env` file
5. **Virtual Environment:** Hostinger Python App handles this automatically

---

## 📝 Summary

**Frontend:** Build first (`npm run build`) → Upload `dist/` folder  
**Backend:** No build needed → Upload `backend/` folder directly → Install dependencies on server

That's it! Much simpler than frontend. 🎉
