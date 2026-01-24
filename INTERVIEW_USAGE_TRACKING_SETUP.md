# Interview Usage Tracking Setup Guide

## Overview
This system tracks monthly mock interview usage for users:
- **Free users**: 5 interviews per month
- **Paid users**: 25 interviews per month
- Usage resets automatically at the start of each month

## Supabase Database Changes

### Step 1: Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250124000000_create_interview_usage_tracking.sql`
4. Click **Run** to execute the migration

### Step 2: Verify Tables Created

After running the migration, you should see two new tables:

1. **`user_subscriptions`**
   - Tracks user subscription plans (free/paid)
   - Automatically creates a free subscription for new users

2. **`interview_usage`**
   - Tracks monthly interview usage per user
   - Resets automatically each month

### Step 3: Set Up Service Role Key

The backend needs the Supabase Service Role Key to manage usage tracking:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **Service Role Key** (not the anon key)
3. Add it to your Railway backend service environment variables:
   - Variable name: `SUPABASE_SERVICE_ROLE_KEY`
   - Variable value: `your-service-role-key-here`

Also add:
- Variable name: `SUPABASE_URL`
- Variable value: `https://your-project.supabase.co`

## Backend Environment Variables

Add these to your Railway backend service:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## How It Works

### 1. Usage Check
- Before starting an interview, the frontend calls `/api/usage/check/{user_id}`
- Backend checks if user has remaining interviews for the current month
- Returns `can_proceed: true/false` with usage details

### 2. Usage Increment
- After successfully completing an interview (getting feedback), the frontend calls `/api/usage/increment`
- Backend increments the usage count for the current month
- Creates a new record if it's the first interview of the month

### 3. Monthly Reset
- Usage is tracked by month (first day of month: YYYY-MM-01)
- Each month, a new record is created automatically
- Old records are kept for historical tracking

## API Endpoints

### Check Usage
```
GET /api/usage/check/{user_id}
```
Returns:
```json
{
  "can_proceed": true,
  "current_usage": 3,
  "usage_limit": 5,
  "plan_type": "free",
  "message": null
}
```

### Increment Usage
```
POST /api/usage/increment
Body: { "user_id": "uuid" }
```
Returns:
```json
{
  "success": true,
  "new_count": 4,
  "message": "Usage incremented successfully"
}
```

### Get Usage Status
```
GET /api/usage/status/{user_id}
```
Returns:
```json
{
  "plan_type": "free",
  "current_usage": 3,
  "usage_limit": 5,
  "remaining": 2,
  "current_month": "2025-01-01"
}
```

## Upgrading Users to Paid Plan

To upgrade a user to paid plan, run this SQL in Supabase:

```sql
UPDATE user_subscriptions
SET plan_type = 'paid',
    subscription_start_date = NOW(),
    updated_at = NOW()
WHERE user_id = 'user-uuid-here';
```

Or use the Supabase dashboard to manually update the `plan_type` field.

## Frontend Features

1. **Usage Display**: Shows current usage (e.g., "3 / 5") in the Interview page header
2. **Usage Check**: Prevents starting interviews if limit is reached
3. **Error Messages**: Shows clear error when limit is reached
4. **Auto-increment**: Automatically increments usage after successful interview completion

## Testing

1. Sign up as a new user (should get free plan automatically)
2. Try to start an interview (should work)
3. Complete 5 interviews (should work)
4. Try to start a 6th interview (should show error message)
5. Upgrade to paid plan in database
6. Try again (should work, now with 25 limit)

## Notes

- Usage is tracked per calendar month
- Records are created on-demand (first interview of the month)
- Historical data is preserved for analytics
- The system automatically handles month transitions
