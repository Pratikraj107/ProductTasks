# Mobile Auth Setup (MSG91 + Supabase)

## What’s implemented

- **Backend:** `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp`
- **Frontend:** Sign In and Sign Up pages have **Email** and **Phone** tabs; phone flow uses OTP and then logs the user in via Supabase session.

## What you need to do

### 1. Supabase

- **Run the migration** so the `phone_otps` table exists:
  - In Supabase Dashboard: **SQL Editor** → run the contents of  
    `supabase/migrations/20250219000000_create_phone_otps_table.sql`
  - Or, if you use the Supabase CLI: `supabase db push` (or `supabase migration up`).

- **Add to `backend/.env`** (same as usage tracker):
  - `SUPABASE_URL` = your project URL (e.g. `https://xxxx.supabase.co`)
  - `SUPABASE_SERVICE_ROLE_KEY` = your **service role** key (Dashboard → Project Settings → API → `service_role`; keep it secret).

Without these, send-otp will work (MSG91) but verify-otp will return 503.

### 2. MSG91

- **Already in `.env`:** `MSG91_AUTH_KEY=495473TfndDkfG699858c5P1`
- **Optional:** If your MSG91 sender is different, set `MSG91_SENDER_ID` (max 6 characters) in `backend/.env`.

### 3. Backend URL (frontend)

- Frontend calls `VITE_API_BASE_URL` for auth. Default is `http://localhost:8000`.
- For production, set `VITE_API_BASE_URL` to your backend URL (e.g. `https://api.yourapp.com`) in your build env or `.env`.

### 4. Default country code

- Phone numbers are normalized to digits. If the user enters 10 digits, the backend prepends **91** (India). To change this, set `DEFAULT_COUNTRY_CODE` in `src/utils/phoneValidation.ts` and ensure MSG91 sends to the correct international number.

---

## Quick checklist

- [ ] Run Supabase migration for `phone_otps`
- [ ] Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env`
- [ ] (Optional) Set `MSG91_SENDER_ID` in `backend/.env` if required by MSG91
- [ ] Start backend and frontend; use Sign In → Phone or Sign Up → Phone to test

After this, mobile auth (send OTP → enter OTP → sign in) should work end-to-end.
