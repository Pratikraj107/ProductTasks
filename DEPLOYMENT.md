# Deployment Guide for Hostinger

This guide will help you deploy both the frontend (React/Vite) and backend (FastAPI) to Hostinger.

## Prerequisites

1. Hostinger account with:
   - Web hosting (for frontend)
   - Python hosting or VPS (for backend)
2. Domain name configured
3. SSH access (if using VPS)

---

## Part 1: Backend Deployment (FastAPI)

### Option A: Using Hostinger Python Hosting

1. **Upload Backend Files**
   ```bash
   # On your local machine, compress the backend folder
   cd backend
   tar -czf backend.tar.gz *
   ```

2. **Upload to Hostinger**
   - Log into Hostinger File Manager
   - Navigate to your domain's root or subdomain (e.g., `api.yourdomain.com`)
   - Upload `backend.tar.gz` and extract it

3. **Set Up Python Environment**
   - In Hostinger control panel, go to Python App
   - Create a new Python app
   - Set Python version to 3.11 or 3.12
   - Point it to your backend directory

4. **Install Dependencies**
   - Use Hostinger's terminal/SSH or Python App interface
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables**
   - In Hostinger Python App settings, add environment variable:
     - `OPENAI_API_KEY` = your OpenAI API key
   - OR create `.env` file in backend directory:
     ```
     OPENAI_API_KEY=sk-your-actual-api-key-here
     ```

6. **Configure WSGI/ASGI**
   - Create `passenger_wsgi.py` in backend directory:
   ```python
   import sys
   import os
   
   # Add the backend directory to the path
   sys.path.insert(0, os.path.dirname(__file__))
   
   from main import app
   application = app
   ```

7. **Update CORS Settings**
   - Edit `backend/main.py` to allow your frontend domain:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://yourdomain.com",
           "https://www.yourdomain.com",
           "http://localhost:5173"  # Keep for local dev
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Option B: Using Hostinger VPS

1. **SSH into your VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Python and Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx
   ```

3. **Upload Backend Files**
   ```bash
   # Use SCP or SFTP to upload backend folder
   scp -r backend/ root@your-vps-ip:/var/www/backend
   ```

4. **Set Up Virtual Environment**
   ```bash
   cd /var/www/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Create Systemd Service**
   Create `/etc/systemd/system/producttasks-api.service`:
   ```ini
   [Unit]
   Description=ProductTasks API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/backend
   Environment="PATH=/var/www/backend/venv/bin"
   ExecStart=/var/www/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

6. **Start the Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable producttasks-api
   sudo systemctl start producttasks-api
   ```

7. **Configure Nginx Reverse Proxy**
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

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/producttasks-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## Part 2: Frontend Deployment (React/Vite)

### Step 1: Update API Configuration

1. **Create Environment File**
   Create `.env.production` in project root:
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

2. **Update MockInterviewModal.tsx**
   The API URL should use environment variable (we'll fix this)

### Step 2: Build Frontend

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with production-ready files.

### Step 3: Upload to Hostinger

1. **Via File Manager**
   - Log into Hostinger File Manager
   - Navigate to `public_html` (or your domain's root)
   - Upload all files from the `dist` folder
   - Make sure `index.html` is in the root

2. **Via FTP/SFTP**
   ```bash
   # Using FileZilla or similar
   # Connect to your Hostinger FTP
   # Upload all files from dist/ to public_html/
   ```

3. **Via Git (Recommended)**
   ```bash
   # On Hostinger, set up Git deployment
   # Push your code to GitHub/GitLab
   # Use Hostinger's Git integration to auto-deploy
   ```

### Step 4: Configure .htaccess (for SPA routing)

Create `.htaccess` in `public_html`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Part 3: Configuration Updates

### Update Frontend API URL

We need to make the API URL configurable. Update `src/components/MockInterviewModal.tsx`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

### Update Backend CORS

Update `backend/main.py` to include your production domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        "http://localhost:5173"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Part 4: Testing

1. **Test Backend**
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Test Frontend**
   - Visit `https://yourdomain.com`
   - Check browser console for errors
   - Test the interview feature

---

## Troubleshooting

### Backend Issues

1. **Module not found errors**
   - Ensure all dependencies are installed
   - Check Python version (3.11+)

2. **Port already in use**
   - Change port in systemd service or use Nginx reverse proxy

3. **CORS errors**
   - Verify frontend domain is in `allow_origins` list
   - Check that backend is accessible

### Frontend Issues

1. **404 on page refresh**
   - Ensure `.htaccess` is configured correctly
   - Check that mod_rewrite is enabled

2. **API connection errors**
   - Verify `VITE_API_BASE_URL` is set correctly
   - Check browser console for CORS errors
   - Verify backend is running and accessible

3. **Build errors**
   - Clear `node_modules` and reinstall
   - Check for TypeScript errors: `npm run typecheck`

---

## Security Checklist

- [ ] Update CORS to only allow your domain
- [ ] Use HTTPS for both frontend and backend
- [ ] Keep `.env` file secure (don't commit to Git)
- [ ] Use environment variables for sensitive data
- [ ] Enable firewall on VPS
- [ ] Keep dependencies updated
- [ ] Use strong passwords for SSH/database

---

## Maintenance

1. **Update Backend**
   ```bash
   # SSH into server
   cd /var/www/backend
   git pull  # If using Git
   source venv/bin/activate
   pip install -r requirements.txt
   sudo systemctl restart producttasks-api
   ```

2. **Update Frontend**
   ```bash
   # On local machine
   npm run build
   # Upload new dist/ folder to Hostinger
   ```

---

## Support

If you encounter issues:
1. Check Hostinger documentation
2. Review server logs: `sudo journalctl -u producttasks-api -f`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
