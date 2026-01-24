# Fix "Connection Refused" Error for Payment API

## Problem
When clicking "Start Monthly Plan" or "Start Yearly Plan", you get:
- **Error**: "Connection Refused" in Network tab
- **API Call**: `/api/payments/create-order` fails

## Root Cause
The frontend is trying to connect to `http://localhost:8000` because `VITE_API_BASE_URL` is not set in Railway frontend service.

## Solution: Set VITE_API_BASE_URL in Railway

### Step 1: Get Your Backend Railway URL

1. Go to **Railway Dashboard** → Your Project
2. Find your **Backend Service** (separate from frontend)
3. Go to **Settings** → **Networking**
4. Copy the **Public Domain** URL
   - Example: `https://product-tasks-api-production-f3b9.up.railway.app`

### Step 2: Add Environment Variable to Frontend Service

1. Go to your **Frontend Service** in Railway
   - This is the service showing `producttasks-production.up.railway.app`

2. Go to **Variables** tab

3. Click **"+ New Variable"**

4. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.up.railway.app`
     - Replace with your actual backend URL from Step 1
     - **Important**: Include `https://` and no trailing slash

5. Click **"Save"**

### Step 3: Redeploy Frontend

1. Railway should auto-redeploy after adding the variable
2. Or go to **Deployments** tab → Click **"Redeploy"**
3. Wait for deployment to complete

### Step 4: Verify

1. Visit your frontend: `https://producttasks-production.up.railway.app`
2. Open browser console (F12) → **Network** tab
3. Click "Start Monthly Plan"
4. Check the API call:
   - Should go to: `https://your-backend-url.up.railway.app/api/payments/create-order`
   - Should NOT go to: `http://localhost:8000/api/payments/create-order`

## Quick Checklist

- [ ] Backend service is deployed and running on Railway
- [ ] Backend URL is accessible (test: `https://your-backend-url.up.railway.app/health`)
- [ ] `VITE_API_BASE_URL` is set in **Frontend Service** variables
- [ ] Value includes `https://` (not `http://`)
- [ ] No trailing slash in the URL
- [ ] Frontend service has been redeployed after adding the variable

## Example Configuration

**Frontend Service Variables:**
```
VITE_API_BASE_URL=https://product-tasks-api-production-f3b9.up.railway.app
```

**Backend Service Variables:**
```
OPENAI_API_KEY=sk-your-key-here
RAZORPAY_KEY_ID=rzp_live_S7ccV9yOafaazm
RAZORPAY_KEY_SECRET=vILURexb5t3Fq1LxWO9potX4
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_DOMAIN=producttasks.com
RAILWAY_FRONTEND_DOMAIN=https://producttasks-production.up.railway.app
```

## Still Not Working?

1. **Check browser console** for the exact error
2. **Check Network tab** to see what URL it's trying to connect to
3. **Verify backend is running**: Visit `https://your-backend-url.up.railway.app/health`
4. **Check Railway logs** for backend service errors
5. **Clear browser cache** and try again
