# Complete Hostinger Deployment Guide

This guide will walk you through deploying both Frontend (React/Vite) and Backend (FastAPI) to Hostinger.

---

## Prerequisites

✅ Hostinger account with:
- Web hosting (for frontend)
- Python hosting or VPS (for backend)

✅ Domain name configured:
- Frontend: `yourdomain.com` or `www.yourdomain.com`
- Backend: `api.yourdomain.com` (subdomain recommended)

✅ SSH access (if using VPS)

---

## Part 1: Prepare Frontend for Deployment

### Step 1: Create Production Environment File

Create a file named `.env.production` in the project root:

```bash
# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Important:** Replace `api.yourdomain.com` with your actual backend subdomain.

### Step 2: Build Frontend

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with all production files.

### Step 3: Verify Build

Check that the `dist` folder contains:
- `index.html`
- `assets/` folder with JS and CSS files
- `.htaccess` file (should be copied automatically)

---

## Part 2: Prepare Backend for Deployment

### Step 1: Update CORS Settings

Edit `backend/main.py` and update the CORS configuration:

```python
# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:5174"
).split(",")

# Add production domains
PRODUCTION_DOMAIN = os.getenv("FRONTEND_DOMAIN", "yourdomain.com")
if PRODUCTION_DOMAIN:
    ALLOWED_ORIGINS.extend([
        f"https://{PRODUCTION_DOMAIN}",
        f"https://www.{PRODUCTION_DOMAIN}",
        f"http://{PRODUCTION_DOMAIN}",
        f"http://www.{PRODUCTION_DOMAIN}"
    ])
```

**Replace `yourdomain.com` with your actual domain.**

### Step 2: Prepare Environment Variables

Create `.env` file in `backend/` folder:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
FRONTEND_DOMAIN=yourdomain.com
```

---

## Part 3: Deploy Frontend to Hostinger

### Option A: Using File Manager (Easiest)

1. **Log into Hostinger Control Panel**
   - Go to File Manager

2. **Navigate to public_html**
   - This is your website root directory

3. **Upload Files**
   - Upload ALL files from the `dist` folder
   - Make sure `index.html` is in the root of `public_html`
   - Upload `.htaccess` file to `public_html` root

4. **Verify File Structure**
   ```
   public_html/
   ├── index.html
   ├── .htaccess
   └── assets/
       ├── index-xxxxx.js
       └── index-xxxxx.css
   ```

### Option B: Using FTP/SFTP

1. **Get FTP Credentials**
   - From Hostinger control panel → FTP Accounts

2. **Connect via FileZilla or similar**
   - Host: `ftp.yourdomain.com` or IP
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (or 22 for SFTP)

3. **Upload Files**
   - Navigate to `public_html` on server
   - Upload all files from `dist/` folder
   - Upload `.htaccess` file

### Option C: Using Git (Recommended for Updates)

1. **Push to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Set up Git in Hostinger**
   - Go to Hostinger → Advanced → Git
   - Connect your repository
   - Set deployment path to `public_html`
   - Enable auto-deploy

3. **Build on Server**
   - Hostinger will pull code
   - Run `npm install && npm run build`
   - Files will be in `dist/` folder

---

## Part 4: Deploy Backend to Hostinger

### Option A: Using Hostinger Python Hosting

1. **Create Python App**
   - Go to Hostinger → Python App
   - Create new application
   - Set Python version: 3.11 or 3.12
   - Point to your backend directory

2. **Upload Backend Files**
   - Upload entire `backend/` folder
   - Structure should be:
     ```
     backend/
     ├── main.py
     ├── requirements.txt
     ├── .env
     └── agents/
         ├── interview_feedback.py
         └── resume_reviewer.py
     ```

3. **Install Dependencies**
   - Use Hostinger terminal or Python App interface
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set Environment Variables**
   - In Python App settings → Environment Variables
   - Add:
     - `OPENAI_API_KEY` = your OpenAI API key
     - `FRONTEND_DOMAIN` = yourdomain.com

5. **Configure WSGI**
   - Create `passenger_wsgi.py` in backend folder:
   ```python
   import sys
   import os
   
   sys.path.insert(0, os.path.dirname(__file__))
   
   from main import app
   application = app
   ```

6. **Set Application Root**
   - Point to `backend/` directory
   - Set startup file to `passenger_wsgi.py`

### Option B: Using Hostinger VPS

1. **SSH into VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx
   ```

3. **Create Directory**
   ```bash
   sudo mkdir -p /var/www/producttasks-backend
   sudo chown -R $USER:$USER /var/www/producttasks-backend
   ```

4. **Upload Backend Files**
   - Use SCP or SFTP to upload `backend/` folder
   ```bash
   scp -r backend/* root@your-vps-ip:/var/www/producttasks-backend/
   ```

5. **Set Up Virtual Environment**
   ```bash
   cd /var/www/producttasks-backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

6. **Create Systemd Service**
   Create `/etc/systemd/system/producttasks-api.service`:
   ```ini
   [Unit]
   Description=ProductTasks API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/producttasks-backend
   Environment="PATH=/var/www/producttasks-backend/venv/bin"
   Environment="OPENAI_API_KEY=sk-your-key-here"
   Environment="FRONTEND_DOMAIN=yourdomain.com"
   ExecStart=/var/www/producttasks-backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

7. **Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable producttasks-api
   sudo systemctl start producttasks-api
   sudo systemctl status producttasks-api
   ```

8. **Configure Nginx**
   Create `/etc/nginx/sites-available/producttasks-api`:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

9. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/producttasks-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

10. **Set Up SSL (Let's Encrypt)**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.yourdomain.com
    ```

---

## Part 5: Final Configuration

### 1. Update Frontend Environment Variable

Make sure `.env.production` has the correct backend URL:
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Rebuild Frontend (if needed)

```bash
npm run build
```

Upload new `dist/` files to Hostinger.

### 3. Test Backend

```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Should return: {"status":"healthy","agent_ready":true}
```

### 4. Test Frontend

- Visit `https://yourdomain.com`
- Open browser console (F12)
- Check for any errors
- Test the "Try Now" button on interview questions

---

## Part 6: Troubleshooting

### Frontend Issues

**Problem: 404 on page refresh**
- **Solution:** Make sure `.htaccess` is in `public_html` root
- Verify mod_rewrite is enabled in Hostinger

**Problem: API connection errors**
- **Solution:** 
  - Check `VITE_API_BASE_URL` in `.env.production`
  - Verify backend is running
  - Check CORS settings in backend

**Problem: White screen**
- **Solution:**
  - Check browser console for errors
  - Verify all files uploaded correctly
  - Check file permissions

### Backend Issues

**Problem: Module not found**
- **Solution:**
  - Run `pip install -r requirements.txt` again
  - Check Python version (3.11+)

**Problem: CORS errors**
- **Solution:**
  - Update `FRONTEND_DOMAIN` in backend `.env`
  - Restart backend server
  - Check `allow_origins` in `main.py`

**Problem: OpenAI API errors**
- **Solution:**
  - Verify `OPENAI_API_KEY` is set correctly
  - Check API key is valid
  - Check OpenAI account has credits

**Problem: Port already in use**
- **Solution:**
  - Change port in systemd service
  - Or use Nginx reverse proxy (recommended)

---

## Part 7: Quick Deployment Checklist

### Frontend
- [ ] Created `.env.production` with correct API URL
- [ ] Built frontend: `npm run build`
- [ ] Uploaded `dist/` folder contents to `public_html/`
- [ ] Uploaded `.htaccess` file
- [ ] Tested website loads correctly
- [ ] Tested "Try Now" button works

### Backend
- [ ] Updated CORS in `main.py` with your domain
- [ ] Created `.env` file with `OPENAI_API_KEY`
- [ ] Uploaded backend files to server
- [ ] Installed dependencies: `pip install -r requirements.txt`
- [ ] Set environment variables
- [ ] Started backend server
- [ ] Configured Nginx (if using VPS)
- [ ] Set up SSL certificate
- [ ] Tested `/health` endpoint

### Both
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser console
- [ ] Interview feature works end-to-end
- [ ] All features tested

---

## Part 8: Updating After Deployment

### Update Frontend

1. Make changes locally
2. Build: `npm run build`
3. Upload new `dist/` files to Hostinger
4. Clear browser cache

### Update Backend

1. Make changes locally
2. Upload changed files to server
3. SSH into server (if VPS):
   ```bash
   cd /var/www/producttasks-backend
   source venv/bin/activate
   pip install -r requirements.txt  # If dependencies changed
   sudo systemctl restart producttasks-api
   ```

---

## Quick Reference

### Important Files
- Frontend: `dist/` folder → upload to `public_html/`
- Backend: `backend/` folder → upload to server
- `.htaccess` → upload to `public_html/` root
- `.env.production` → for frontend build
- `backend/.env` → for backend runtime

### Important URLs
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com`
- Health Check: `https://api.yourdomain.com/health`

### Environment Variables

**Frontend (.env.production):**
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Backend (backend/.env):**
```
OPENAI_API_KEY=sk-your-key-here
FRONTEND_DOMAIN=yourdomain.com
```

---

## Need Help?

1. Check Hostinger documentation
2. Review server logs
3. Check browser console for frontend errors
4. Test backend endpoints with curl or Postman

Good luck with your deployment! 🚀
