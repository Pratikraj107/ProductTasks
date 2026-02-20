"""
Mobile auth API: send OTP via MSG91, verify OTP, create/get Supabase user, return session.
"""
import os
import hashlib
import secrets
import re
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Use same Supabase env pattern as usage_tracker
_proxy_vars = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]
for var in _proxy_vars:
    if var in os.environ:
        os.environ.pop(var, None)

from supabase import create_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
OTP_LENGTH = int(os.getenv("OTP_LENGTH", "6"))
RESEND_COOLDOWN_SECONDS = int(os.getenv("RESEND_COOLDOWN_SECONDS", "60"))
PLACEHOLDER_EMAIL_DOMAIN = os.getenv("PLACEHOLDER_EMAIL_DOMAIN", "producttasks.placeholder")


def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=503,
            detail="Server auth not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
        )
    return create_client(url, key)


def normalize_phone(phone: str) -> str:
    """Return digits only for storage/key."""
    return re.sub(r"\D", "", phone.strip())


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def generate_placeholder_email(phone: str) -> str:
    """Unique placeholder email for Supabase auth (no real inbox)."""
    normalized = normalize_phone(phone)
    safe = hashlib.sha256(normalized.encode()).hexdigest()[:16]
    return f"phone_{safe}@{PLACEHOLDER_EMAIL_DOMAIN}"


class SendOtpRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str


def _get_single_row(result):
    """Get single row from Supabase result; .data can be dict or list depending on client version."""
    if not result or not getattr(result, "data", None):
        return None
    data = result.data
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return None


@router.post("/send-otp")
async def send_otp(req: SendOtpRequest):
    """Generate OTP, store hash in DB, send via MSG91. Enforce resend cooldown."""
    try:
        from services.msg91_service import send_otp as msg91_send
    except ModuleNotFoundError:
        try:
            from backend.services.msg91_service import send_otp as msg91_send
        except Exception as e:
            logger.exception("Failed to import msg91_service: %s", e)
            raise HTTPException(status_code=503, detail="OTP service unavailable")
    except Exception as e:
        logger.exception("Failed to import msg91_service: %s", e)
        raise HTTPException(status_code=503, detail="OTP service unavailable")

    phone = normalize_phone(req.phone)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    try:
        supabase = get_supabase()
    except HTTPException:
        raise

    sender_id = os.getenv("MSG91_SENDER_ID")

    # Cooldown: do not send if last created_at is within RESEND_COOLDOWN_SECONDS
    try:
        existing = (
            supabase.table("phone_otps")
            .select("created_at")
            .eq("phone", phone)
            .maybe_single()
            .execute()
        )
        row_data = _get_single_row(existing)
        if row_data and row_data.get("created_at"):
            created_str = row_data["created_at"].replace("Z", "+00:00")
            created = datetime.fromisoformat(created_str)
            now = datetime.utcnow()
            if created.tzinfo:
                now = datetime.now(created.tzinfo)
            if (now - created).total_seconds() < RESEND_COOLDOWN_SECONDS:
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {RESEND_COOLDOWN_SECONDS} seconds before resending OTP",
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error checking OTP cooldown: %s", e)
        raise HTTPException(status_code=500, detail="Error checking rate limit")

    otp = "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))
    expires_at = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat() + "Z"
    otp_hash = hash_otp(otp)

    row = {
        "phone": phone,
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    try:
        supabase.table("phone_otps").upsert(row, on_conflict="phone").execute()
    except Exception as e:
        logger.exception("Error storing OTP: %s", e)
        raise HTTPException(status_code=500, detail="Error storing OTP. Check database and env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).")

    ok, msg = msg91_send(phone, otp, sender_id)
    if not ok:
        raise HTTPException(status_code=502, detail=msg or "Failed to send OTP")

    return {"success": True, "message": "OTP sent"}


@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """Verify OTP, create or get Supabase user, return session tokens for setSession."""
    phone = normalize_phone(req.phone)
    otp = (req.otp or "").strip()
    if len(phone) < 10 or len(otp) != OTP_LENGTH:
        raise HTTPException(status_code=400, detail="Invalid phone or OTP")

    supabase = get_supabase()

    row = (
        supabase.table("phone_otps")
        .select("otp_hash, expires_at")
        .eq("phone", phone)
        .maybe_single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=400, detail="OTP expired or not found")

    expires_at = datetime.fromisoformat(row.data["expires_at"].replace("Z", "+00:00"))
    if datetime.now(expires_at.tzinfo) >= expires_at:
        supabase.table("phone_otps").delete().eq("phone", phone).execute()
        raise HTTPException(status_code=400, detail="OTP expired")

    if hash_otp(otp) != row.data["otp_hash"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Delete OTP so it can't be reused
    supabase.table("phone_otps").delete().eq("phone", phone).execute()

    email = generate_placeholder_email(phone)
    # Deterministic password so we can sign in on every OTP verify (no DB storage)
    secret = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or "phone-auth-secret"
    password = hashlib.sha256(f"{phone}:{secret}".encode()).hexdigest()[:32]

    try:
        import httpx
        base_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

        # Create user if not exists (admin API)
        create_r = httpx.post(
            f"{base_url}/auth/v1/admin/users",
            headers=headers,
            json={"email": email, "password": password, "email_confirm": True},
            timeout=10,
        )
        # 422/400 can mean user already exists
        if create_r.status_code not in (200, 201, 422):
            pass  # try sign-in anyway

        # Get session via password grant
        token_r = httpx.post(
            f"{base_url}/auth/v1/token?grant_type=password",
            headers={"apikey": key, "Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=10,
        )
        if token_r.status_code != 200:
            raise HTTPException(status_code=500, detail="Could not create session")
        data = token_r.json()
        return {
            "access_token": data.get("access_token"),
            "refresh_token": data.get("refresh_token"),
            "expires_in": data.get("expires_in"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resend-otp")
async def resend_otp(req: SendOtpRequest):
    """Same as send-otp (cooldown enforced in send_otp)."""
    return await send_otp(req)
