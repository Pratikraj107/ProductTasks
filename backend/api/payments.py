"""
Razorpay payment processing API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import razorpay
from datetime import datetime, timedelta
from supabase import create_client, Client

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("Warning: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not set. Payment features will not work.")
    razorpay_client = None
else:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def get_supabase_client() -> Client:
    """Get Supabase client"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

class CreateOrderRequest(BaseModel):
    user_id: str
    plan_type: str  # 'monthly' or 'yearly'
    amount: int  # Amount in paise (₹800 = 80000, ₹6000 = 600000)

class VerifyPaymentRequest(BaseModel):
    user_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_type: str

# Plan configurations
PLAN_CONFIGS = {
    "monthly": {
        "amount": 80000,  # ₹800 in paise
        "duration_days": 30,
        "name": "Monthly Plan"
    },
    "yearly": {
        "amount": 600000,  # ₹6000 in paise
        "duration_days": 365,
        "name": "Yearly Plan"
    }
}

@router.post("/create-order")
async def create_order(request: CreateOrderRequest):
    """
    Create a Razorpay order for subscription payment
    """
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    if request.plan_type not in PLAN_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    plan_config = PLAN_CONFIGS[request.plan_type]
    
    # Validate amount
    if request.amount != plan_config["amount"]:
        raise HTTPException(status_code=400, detail="Invalid amount for selected plan")
    
    try:
        # Create Razorpay order
        order_data = {
            "amount": request.amount,  # Amount in paise
            "currency": "INR",
            "receipt": f"order_{request.user_id}_{int(datetime.now().timestamp())}",
            "notes": {
                "user_id": request.user_id,
                "plan_type": request.plan_type,
                "plan_name": plan_config["name"]
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "success": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(request: VerifyPaymentRequest):
    """
    Verify Razorpay payment and update user subscription
    """
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # Verify payment signature
        params_dict = {
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature
        }
        
        # Verify signature
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get payment details
        payment = razorpay_client.payment.fetch(request.razorpay_payment_id)
        
        if payment["status"] != "captured":
            raise HTTPException(status_code=400, detail="Payment not captured")
        
        # Update user subscription in database
        supabase = get_supabase_client()
        plan_config = PLAN_CONFIGS[request.plan_type]
        
        # Calculate subscription end date
        subscription_start = datetime.now()
        subscription_end = subscription_start + timedelta(days=plan_config["duration_days"])
        
        # Update or create subscription
        subscription_data = {
            "user_id": request.user_id,
            "plan_type": "paid",
            "subscription_start_date": subscription_start.isoformat(),
            "subscription_end_date": subscription_end.isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Check if subscription exists
        existing = supabase.table("user_subscriptions").select("*").eq("user_id", request.user_id).maybe_single().execute()
        
        if existing.data:
            # Update existing subscription
            supabase.table("user_subscriptions").update(subscription_data).eq("user_id", request.user_id).execute()
        else:
            # Create new subscription
            supabase.table("user_subscriptions").insert(subscription_data).execute()
        
        # Store payment record (optional - you might want to create a payments table)
        # For now, we'll just return success
        
        return {
            "success": True,
            "message": "Payment verified and subscription updated",
            "subscription_end_date": subscription_end.isoformat(),
            "plan_type": "paid"
        }
    
    except Exception as sig_error:
        # Check if it's a signature verification error
        error_msg = str(sig_error).lower()
        if "signature" in error_msg or "verification" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying payment: {str(e)}")

@router.get("/plans")
async def get_plans():
    """
    Get available subscription plans
    """
    return {
        "plans": {
            "monthly": {
                "name": "Monthly Plan",
                "amount": 80000,
                "amount_display": "₹800",
                "duration_days": 30,
                "features": [
                    "50 AI interview questions per month",
                    "Full AI-powered feedback",
                    "Real-time transcription",
                    "All 600+ questions access"
                ]
            },
            "yearly": {
                "name": "Yearly Plan",
                "amount": 600000,
                "amount_display": "₹6,000",
                "duration_days": 365,
                "features": [
                    "600 AI interview questions per year",
                    "Full AI-powered feedback",
                    "Real-time transcription",
                    "All 600+ questions access",
                    "Save ₹3,600 annually"
                ]
            }
        }
    }
