# Quick Deployment Checklist

## Before You Start

1. **Get your domain ready**
   - Frontend: `yourdomain.com` or `www.yourdomain.com`
   - Backend: `api.yourdomain.com` (subdomain recommended)

2. **Prepare environment variables**
   - Frontend: `VITE_API_BASE_URL=https://api.yourdomain.com`
   - Backend: `OPENAI_API_KEY=sk-your-key-here`

---

## Quick Steps

### Frontend (5 minutes)

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Create `.env.production` file:**
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

3. **Upload to Hostinger:**
   - Upload all files from `dist/` folder to `public_html/`
   - Upload `.htaccess` file to `public_html/` root

4. **Done!** Your frontend should be live.

### Backend (15-30 minutes)

**Option 1: Python Hosting (Easiest)**
1. Upload `backend/` folder to Hostinger
2. In Python App settings:
   - Set Python version (3.11+)
   - Point to backend directory
   - Add environment variable: `OPENAI_API_KEY`
3. Install dependencies via terminal
4. Update CORS in `main.py` with your domain

**Option 2: VPS (More Control)**
1. Follow the detailed guide in `DEPLOYMENT.md`
2. Set up Nginx reverse proxy
3. Configure SSL with Let's Encrypt

---

## Configuration Files Created

✅ `DEPLOYMENT.md` - Complete deployment guide
✅ `.htaccess` - SPA routing and optimization
✅ `.env.production.example` - Environment variable template
✅ `deploy.sh` - Quick deployment script

---

## Important Notes

1. **API URL**: Make sure `VITE_API_BASE_URL` matches your backend URL
2. **CORS**: Update backend `main.py` to allow your frontend domain
3. **SSL**: Use HTTPS for both frontend and backend
4. **Environment Variables**: Never commit `.env` files to Git

---

## Testing After Deployment

1. Visit your frontend: `https://yourdomain.com`
2. Test backend: `https://api.yourdomain.com/health`
3. Try the interview feature
4. Check browser console for errors

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Review Hostinger documentation
- Check server logs for errors
