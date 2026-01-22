# Quick Deployment Checklist

## 🎯 Pre-Deployment Steps

### Frontend Preparation
- [ ] Create `.env.production` file with: `VITE_API_BASE_URL=https://api.yourdomain.com`
- [ ] Run `npm install` to ensure dependencies are installed
- [ ] Run `npm run build` to create production build
- [ ] Verify `dist/` folder contains all files
- [ ] Check that `.htaccess` file exists in project root

### Backend Preparation
- [ ] Update `backend/main.py` CORS settings with your domain
- [ ] Create `backend/.env` file with `OPENAI_API_KEY`
- [ ] Test backend locally: `python -m uvicorn main:app --port 8000`
- [ ] Verify all dependencies in `requirements.txt`

---

## 📤 Deployment Steps

### Frontend Deployment
1. [ ] Log into Hostinger File Manager
2. [ ] Navigate to `public_html` folder
3. [ ] Upload ALL files from `dist/` folder
4. [ ] Upload `.htaccess` file to `public_html/` root
5. [ ] Verify file structure is correct
6. [ ] Visit your domain to test

### Backend Deployment

**Option 1: Python Hosting**
1. [ ] Upload `backend/` folder to Hostinger
2. [ ] Create Python App in Hostinger control panel
3. [ ] Set Python version (3.11+)
4. [ ] Point to backend directory
5. [ ] Add environment variables:
   - `OPENAI_API_KEY`
   - `FRONTEND_DOMAIN`
6. [ ] Install dependencies via terminal
7. [ ] Create `passenger_wsgi.py` file
8. [ ] Start the application

**Option 2: VPS**
1. [ ] SSH into VPS
2. [ ] Install Python, pip, nginx
3. [ ] Upload backend files to `/var/www/producttasks-backend`
4. [ ] Create virtual environment
5. [ ] Install dependencies
6. [ ] Create systemd service file
7. [ ] Configure Nginx reverse proxy
8. [ ] Set up SSL certificate
9. [ ] Start services

---

## ✅ Post-Deployment Testing

- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Backend health check: `https://api.yourdomain.com/health`
- [ ] No CORS errors in browser console
- [ ] "Try Now" button opens modal
- [ ] Recording works
- [ ] AI feedback is received
- [ ] All features functional

---

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 404 on refresh | Check `.htaccess` is uploaded |
| CORS errors | Update `FRONTEND_DOMAIN` in backend `.env` |
| API not responding | Check backend is running |
| Module errors | Run `pip install -r requirements.txt` |
| White screen | Check browser console, verify file uploads |

---

## 📝 Important Files to Upload

**Frontend:**
- `dist/index.html`
- `dist/assets/*` (all JS and CSS files)
- `.htaccess`

**Backend:**
- `backend/main.py`
- `backend/requirements.txt`
- `backend/.env`
- `backend/agents/*` (all agent files)

---

## 🔐 Security Reminders

- ✅ Never commit `.env` files to Git
- ✅ Use HTTPS for both frontend and backend
- ✅ Keep API keys secure
- ✅ Update CORS to only allow your domain
- ✅ Use strong passwords for SSH/FTP

---

**Full detailed guide:** See `HOSTINGER_DEPLOYMENT_GUIDE.md`
