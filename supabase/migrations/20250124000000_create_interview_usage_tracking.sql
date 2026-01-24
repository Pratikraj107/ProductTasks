/*
  # Create Interview Usage Tracking Tables

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_type` (text) - 'free' or 'paid'
      - `subscription_start_date` (timestamptz)
      - `subscription_end_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `interview_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `usage_month` (date) - First day of the month (YYYY-MM-01)
      - `usage_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - UNIQUE constraint on (user_id, usage_month)
  
  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own data
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'paid')),
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_type_idx ON public.user_subscriptions(plan_type);

-- Create interview_usage table
CREATE TABLE IF NOT EXISTS public.interview_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_month date NOT NULL, -- First day of the month (YYYY-MM-01)
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_month)
);

ALTER TABLE public.interview_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.interview_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.interview_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.interview_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS interview_usage_user_id_idx ON public.interview_usage(user_id);
CREATE INDEX IF NOT EXISTS interview_usage_month_idx ON public.interview_usage(usage_month);
CREATE INDEX IF NOT EXISTS interview_usage_user_month_idx ON public.interview_usage(user_id, usage_month);

-- Function to get or create default free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create free subscription when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Function to get current month usage or create new record
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_usage(p_user_id uuid)
RETURNS public.interview_usage AS $$
DECLARE
  v_current_month date;
  v_usage_record public.interview_usage;
BEGIN
  -- Get first day of current month
  v_current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Try to get existing record
  SELECT * INTO v_usage_record
  FROM public.interview_usage
  WHERE user_id = p_user_id AND usage_month = v_current_month;
  
  -- If not found, create new record
  IF v_usage_record IS NULL THEN
    INSERT INTO public.interview_usage (user_id, usage_month, usage_count)
    VALUES (p_user_id, v_current_month, 0)
    RETURNING * INTO v_usage_record;
  END IF;
  
  RETURN v_usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
