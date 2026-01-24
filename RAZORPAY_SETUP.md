# Razorpay Payment Integration Setup Guide

## Overview
This guide explains how to set up Razorpay payment integration for subscription plans:
- **Monthly Plan**: ₹800/month
- **Yearly Plan**: ₹6,000/year

## Backend Setup

### Step 1: Add Environment Variables to Railway

Add these environment variables to your Railway backend service:

```
RAZORPAY_KEY_ID=rzp_live_S7ccV9yOafaazm
RAZORPAY_KEY_SECRET=vILURexb5t3Fq1LxWO9potX4
```

**Important**: 
- These are your **live** keys. Keep them secure.
- Never commit these keys to GitHub.
- The keys are already added to `.gitignore`.

### Step 2: Verify Backend Dependencies

The backend `requirements.txt` includes:
```
razorpay==1.4.2
```

This will be installed automatically when Railway deploys.

## Frontend Setup

### Step 1: Razorpay SDK

The Razorpay checkout script is loaded dynamically in the `PaymentModal` component. No npm package installation is required.

### Step 2: Payment Flow

1. User clicks "Start Monthly Plan" or "Start Yearly Plan" on the pricing page
2. Payment modal opens
3. User clicks "Pay ₹800" or "Pay ₹6,000"
4. Razorpay checkout opens
5. User completes payment
6. Payment is verified on backend
7. User subscription is updated in database
8. Page refreshes to show updated subscription

## API Endpoints

### Create Order
```
POST /api/payments/create-order
Body: {
  "user_id": "uuid",
  "plan_type": "monthly" | "yearly",
  "amount": 80000 | 600000  // in paise
}
Response: {
  "success": true,
  "order_id": "order_xxx",
  "amount": 80000,
  "currency": "INR",
  "key_id": "rzp_live_xxx"
}
```

### Verify Payment
```
POST /api/payments/verify-payment
Body: {
  "user_id": "uuid",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "plan_type": "monthly" | "yearly"
}
Response: {
  "success": true,
  "message": "Payment verified and subscription updated",
  "subscription_end_date": "2025-02-24T...",
  "plan_type": "paid"
}
```

### Get Plans
```
GET /api/payments/plans
Response: {
  "plans": {
    "monthly": { ... },
    "yearly": { ... }
  }
}
```

## Database Updates

After successful payment:
- `user_subscriptions` table is updated:
  - `plan_type` → `"paid"`
  - `subscription_start_date` → Current date
  - `subscription_end_date` → Current date + 30 days (monthly) or 365 days (yearly)

## Testing

### Test Mode (Optional)
If you want to test with test keys first:
1. Get test keys from Razorpay Dashboard → Settings → API Keys
2. Use test keys in environment variables
3. Test the payment flow
4. Switch to live keys for production

### Test Cards (Test Mode Only)
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

## Security Notes

1. **Never expose secret key**: The `RAZORPAY_KEY_SECRET` should only be in backend environment variables
2. **Signature verification**: All payments are verified using Razorpay's signature verification
3. **HTTPS required**: Razorpay requires HTTPS in production (Railway provides this automatically)
4. **Webhook (Optional)**: For production, consider setting up Razorpay webhooks for additional security

## Troubleshooting

### Payment Modal Not Opening
- Check browser console for errors
- Verify Razorpay script is loading: `https://checkout.razorpay.com/v1/checkout.js`
- Check if user is signed in

### Payment Verification Fails
- Check backend logs for error details
- Verify `RAZORPAY_KEY_SECRET` is correct
- Ensure signature verification is working

### Subscription Not Updated
- Check Supabase connection
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check database logs

## Next Steps

1. Add environment variables to Railway backend
2. Deploy backend changes
3. Test payment flow with a small amount first
4. Monitor Razorpay dashboard for transactions
5. Set up webhooks (optional but recommended for production)

## Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com/
