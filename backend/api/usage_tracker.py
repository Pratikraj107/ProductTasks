"""
Interview usage tracking API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client, Client

router = APIRouter(prefix="/api/usage", tags=["usage"])

# Initialize Supabase client (lazy initialization)
def get_supabase_client() -> Client:
    """Get Supabase client, creating it if needed"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for backend operations

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")

    return create_client(SUPABASE_URL, SUPABASE_KEY)

class UsageResponse(BaseModel):
    can_proceed: bool
    current_usage: int
    usage_limit: int
    plan_type: str
    message: Optional[str] = None

class IncrementUsageRequest(BaseModel):
    user_id: str

def get_usage_limit(plan_type: str) -> int:
    """Get usage limit based on plan type"""
    if plan_type == "paid":
        return 25
    return 5  # free

@router.get("/check/{user_id}")
async def check_usage(user_id: str) -> UsageResponse:
    """
    Check if user can perform an interview based on their usage limit
    """
    try:
        # Get current month (first day of month)
        from datetime import date
        current_month = date.today().replace(day=1)
        
        supabase = get_supabase_client()
        
        # Get user subscription
        subscription_result = supabase.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
        
        if not subscription_result.data:
            # Create default free subscription if doesn't exist
            supabase.table("user_subscriptions").insert({
                "user_id": user_id,
                "plan_type": "free"
            }).execute()
            plan_type = "free"
        else:
            plan_type = subscription_result.data.get("plan_type", "free")
        
        # Get or create usage record for current month
        usage_result = supabase.table("interview_usage").select("*").eq("user_id", user_id).eq("usage_month", current_month.isoformat()).maybe_single().execute()
        
        if not usage_result.data:
            # Create new usage record for current month
            supabase.table("interview_usage").insert({
                "user_id": user_id,
                "usage_month": current_month.isoformat(),
                "usage_count": 0
            }).execute()
            current_usage = 0
        else:
            current_usage = usage_result.data.get("usage_count", 0)
        
        usage_limit = get_usage_limit(plan_type)
        can_proceed = current_usage < usage_limit
        
        message = None
        if not can_proceed:
            message = f"You have reached your monthly limit of {usage_limit} interviews. Please upgrade to continue."
        
        return UsageResponse(
            can_proceed=can_proceed,
            current_usage=current_usage,
            usage_limit=usage_limit,
            plan_type=plan_type,
            message=message
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking usage: {str(e)}")

@router.post("/increment")
async def increment_usage(request: IncrementUsageRequest) -> dict:
    """
    Increment interview usage count for the current month
    """
    try:
        from datetime import date
        current_month = date.today().replace(day=1)
        
        supabase = get_supabase_client()
        
        # Get or create usage record
        usage_result = supabase.table("interview_usage").select("*").eq("user_id", request.user_id).eq("usage_month", current_month.isoformat()).maybe_single().execute()
        
        if not usage_result.data:
            # Create new usage record
            result = supabase.table("interview_usage").insert({
                "user_id": request.user_id,
                "usage_month": current_month.isoformat(),
                "usage_count": 1
            }).execute()
            new_count = 1
        else:
            # Increment existing usage
            current_count = usage_result.data.get("usage_count", 0)
            new_count = current_count + 1
            supabase.table("interview_usage").update({
                "usage_count": new_count
            }).eq("user_id", request.user_id).eq("usage_month", current_month.isoformat()).execute()
        
        return {
            "success": True,
            "new_count": new_count,
            "message": "Usage incremented successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error incrementing usage: {str(e)}")

@router.get("/status/{user_id}")
async def get_usage_status(user_id: str) -> dict:
    """
    Get current usage status for a user
    """
    try:
        from datetime import date
        current_month = date.today().replace(day=1)
        
        supabase = get_supabase_client()
        
        # Get subscription
        subscription_result = supabase.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
        plan_type = subscription_result.data.get("plan_type", "free") if subscription_result.data else "free"
        
        # Get usage
        usage_result = supabase.table("interview_usage").select("*").eq("user_id", user_id).eq("usage_month", current_month.isoformat()).maybe_single().execute()
        current_usage = usage_result.data.get("usage_count", 0) if usage_result.data else 0
        
        usage_limit = get_usage_limit(plan_type)
        
        return {
            "plan_type": plan_type,
            "current_usage": current_usage,
            "usage_limit": usage_limit,
            "remaining": max(0, usage_limit - current_usage),
            "current_month": current_month.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting usage status: {str(e)}")
