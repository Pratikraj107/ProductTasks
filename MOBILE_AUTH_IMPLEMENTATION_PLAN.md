# Mobile Number Authentication Implementation Plan

## Overview
Implement mobile number-based authentication using MSG91 (for OTP/SMS) and Supabase for user management.

## Current State
- ✅ Email/password authentication exists via Supabase
- ✅ AuthContext and auth flow already implemented
- ✅ Backend API (FastAPI) available for custom endpoints
- ✅ Supabase project configured

## Implementation Approach: Custom MSG91 + Supabase

**Note:** Supabase Phone Auth does **not** support MSG91 directly (it uses Twilio, etc.). So we use a **custom flow**:

1. **Backend (FastAPI)**  
   - Generates OTP and sends it via **MSG91 API**.  
   - Stores OTP (and optional metadata) in a **Supabase table** with expiry.  
   - Exposes: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp`.

2. **After OTP is verified**  
   - Backend creates the user in **Supabase Auth** (if new) using the **Supabase Admin API** (service role).  
   - User is created with a placeholder email (e.g. `phone_<hash>@yourapp.placeholder`) so Supabase’s auth system is used for sessions.  
   - Backend generates a **magic link** (or session) via Admin API and returns the token to the frontend.

3. **Frontend**  
   - Calls send-otp → user enters OTP → calls verify-otp.  
   - Receives session token from verify-otp and establishes session with `supabase.auth.setSession()` (or equivalent).

4. **Database**  
   - One Supabase table for OTPs (phone, otp, expires_at, etc.).  
   - Optionally a `profiles` (or similar) table with `phone` and link to `auth.users` for app-specific data.

This gives you **MSG91 for SMS** and **Supabase for user accounts and sessions**, without using Supabase’s built-in phone provider.

---

## Information Needed from You

### 1. MSG91 Account Details
- [ ] MSG91 API Key (Auth Key)
- [ ] MSG91 Sender ID (6-character alphanumeric)
- [ ] MSG91 Template ID (if using templates)
- [ ] MSG91 Route (Transaction/Promotional) - usually Transactional for OTP

### 2. Supabase Configuration
- [ ] Do you want to keep email auth alongside mobile auth? (Yes/No)
- [ ] Supabase Project URL (already have: `https://lzbzopkhadklniranyuo.supabase.co`)
- [ ] Supabase Service Role Key (for backend operations - **keep secret!** Needed to create users and generate sessions after OTP verify.)

### 3. User Experience Preferences
- [ ] Should users sign up with mobile number only, or also collect email/name?
- [ ] OTP expiration time preference (default: 5 minutes)
- [ ] OTP length preference (default: 6 digits)
- [ ] Resend OTP cooldown (default: 60 seconds)
- [ ] Should we show "Remember me" option?

### 4. Backend Configuration
- [ ] Backend URL/domain (for API endpoints)
- [ ] OTP storage: we will use a **Supabase table** (no Redis required unless you prefer it)

### 5. Database Schema
- [ ] Do you want to add `phone` field to existing user profiles?
- [ ] Should phone number be unique? (Yes - recommended)
- [ ] Country code handling (e.g., +91 for India, +1 for US)

---

## Implementation Steps (Once I Have Info)

### Phase 1: Backend Setup
1. Add MSG91 HTTP client (no SDK required; use their REST API).
2. Create OTP service: generate OTP, store in Supabase table with expiry, call MSG91 to send SMS.
3. Add API endpoints:
   - `POST /api/auth/send-otp` — send OTP to mobile (rate limit / cooldown).
   - `POST /api/auth/verify-otp` — verify OTP; create or get Supabase user; return session (e.g. magic-link token or tokens for `setSession`).
   - `POST /api/auth/resend-otp` — resend OTP (same cooldown).

### Phase 2: Supabase Setup
1. Create table for OTPs (e.g. `phone_otps`: phone, otp_hash, expires_at, created_at).
2. Use **Supabase Service Role** in backend to create user (placeholder email) and generate magic link / session after OTP verify.
3. No need to enable “Phone Auth” in Supabase dashboard; we only use Supabase for user storage and sessions.
4. Set up RLS / profiles if you store `phone` on a profile table.

### Phase 3: Frontend Implementation
1. Create mobile auth components:
   - `MobileSignIn.tsx` - Mobile number input + OTP verification
   - `MobileSignUp.tsx` - Mobile number signup flow
   - `OTPInput.tsx` - Reusable OTP input component
2. Update `AuthContext.tsx`:
   - Add `signInWithPhone`, `signUpWithPhone`, `verifyOTP` methods
3. Update routing to include mobile auth pages
4. Add phone number validation (country code, format)

### Phase 4: Integration & Testing
1. Test OTP send/receive flow
2. Test signup/login flows
3. Handle edge cases (expired OTP, wrong OTP, etc.)
4. Add loading states and error handling

---

## Files That Will Be Created/Modified

### New Files:
- `src/components/MobileAuth/MobileSignIn.tsx`
- `src/components/MobileAuth/MobileSignUp.tsx` (or combined with SignIn)
- `src/components/MobileAuth/OTPInput.tsx`
- `src/utils/phoneValidation.ts`
- `backend/api/mobile_auth.py`
- `backend/services/msg91_service.py`

### Modified Files:
- `src/contexts/AuthContext.tsx` — add mobile auth methods and `setSession` after verify
- `src/pages/SignIn.tsx` — add mobile auth option
- `src/pages/SignUp.tsx` — add mobile auth option
- `src/App.tsx` — add mobile auth routes if needed
- `backend/main.py` — mount mobile auth router
- `backend/.env` — add MSG91 credentials and Supabase Service Role Key

---

## Quick Start Checklist

Please provide:
1. MSG91 API credentials (Auth Key, Sender ID, Template ID if any)
2. Supabase **Service Role Key** (for backend; keep secret)
3. User experience preferences (keep email auth? OTP expiry, resend cooldown)
4. Country codes to support (e.g. +91 for India)

Once I have this, I'll implement the custom MSG91 + Supabase flow.

---

## Questions for You

1. **Do you already have an MSG91 account and credentials?**
2. **What country codes do you want to support?** (e.g. India +91, US +1)
3. **Keep email/password auth alongside mobile, or move fully to mobile?**
4. **Should existing email users be able to link their phone number later?**
