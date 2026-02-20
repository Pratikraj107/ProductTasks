-- Table for storing OTPs sent via MSG91 (custom phone auth)
-- Backend hashes OTP before storing; we store hash + expiry for verification
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT phone_otps_phone_unique UNIQUE (phone)
);

-- Index for fast lookup by phone and expiry cleanup
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON public.phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON public.phone_otps(expires_at);

-- RLS: only service role (backend) can read/write
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for phone_otps"
  ON public.phone_otps
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.phone_otps IS 'OTP storage for mobile auth; backend uses service role to read/write';
