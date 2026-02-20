"""
MSG91 OTP service - send OTP via MSG91 API.
Supports: (1) Legacy GET sendotp.php, (2) Optional V5/flow API for SendOTP product (shows in analytics).
"""
import os
import urllib.parse
import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

# Default message template; MSG91 replaces ##OTP## with the actual OTP
DEFAULT_OTP_MESSAGE = "Your verification code is ##OTP##. Valid for 5 minutes."


def send_otp(phone: str, otp: str, sender_id: str | None = None) -> tuple[bool, str]:
    """
    Send OTP to phone via MSG91.
    Phone must be in international format (e.g. 919876543210 for India).
    Returns (success: bool, message: str).
    """
    auth_key = os.getenv("MSG91_AUTH_KEY")
    if not auth_key:
        return False, "MSG91_AUTH_KEY not configured"

    phone_clean = phone.replace("+", "").replace(" ", "").strip()
    if not phone_clean.isdigit():
        return False, "Invalid phone number"

    # V5/flow API (SendOTP product) - shows in MSG91 analytics and works with DLT in India
    flow_or_template = os.getenv("MSG91_FLOW_ID") or os.getenv("MSG91_OTP_TEMPLATE_ID")

    if flow_or_template:
        ok, msg = _send_otp_v5_flow(phone_clean, otp, auth_key, flow_or_template, sender_id)
    else:
        ok, msg = _send_otp_legacy(phone_clean, otp, auth_key, sender_id)

    if ok:
        logger.info("MSG91 OTP sent to %s*** (v5=%s)", phone_clean[:4], bool(flow_or_template))
    else:
        logger.warning("MSG91 OTP failed for %s***: %s", phone_clean[:4], msg)
    return ok, msg


def _send_otp_legacy(
    phone_clean: str, otp: str, auth_key: str, sender_id: str | None
) -> tuple[bool, str]:
    """Legacy GET sendotp.php - include message so MSG91 can actually send."""
    params = {
        "authkey": auth_key,
        "mobile": phone_clean,
        "otp": otp,
        "message": DEFAULT_OTP_MESSAGE,
        "otp_expiry": os.getenv("OTP_EXPIRY_MINUTES", "5"),
        "otp_length": str(len(otp)),
    }
    if sender_id:
        params["sender"] = sender_id[:6]
    query = urllib.parse.urlencode(params)
    url = f"https://api.msg91.com/api/sendotp.php?{query}"

    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode()
            try:
                data = json.loads(body)
                t = data.get("type", "")
                m = data.get("message", body)
                if t == "success":
                    return True, m
                logger.warning("MSG91 legacy API response: type=%s message=%s", t, m)
                return False, m or "Failed to send OTP"
            except json.JSONDecodeError:
                if "success" in body.lower():
                    return True, "OTP sent"
                return False, body or "Unknown response"
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        logger.warning("MSG91 legacy API HTTPError %s: %s", e.code, body[:200])
        return False, f"HTTP error: {e.code}"
    except urllib.error.URLError as e:
        return False, str(e.reason) if getattr(e, "reason", None) else "Network error"
    except Exception as e:
        logger.exception("MSG91 legacy API exception: %s", e)
        return False, str(e)


def _send_otp_v5_flow(
    phone_clean: str, otp: str, auth_key: str, flow_or_template_id: str, sender_id: str | None
) -> tuple[bool, str]:
    """V5/flow API - used by SendOTP product; shows in MSG91 analytics and works with DLT."""
    try:
        import httpx
    except ImportError:
        logger.warning("httpx not available, falling back to legacy API")
        return _send_otp_legacy(phone_clean, otp, auth_key, sender_id)

    url = "https://api.msg91.com/api/v5/otp"
    headers = {
        "authkey": auth_key,
        "Content-Type": "application/json",
    }
    # MSG91 v5: use flow_id (SendOTP product) or template_id per their docs.
    # Template must contain ##OTP## in message body. Send both "otp" and "OTP" for compatibility.
    body = {
        "short_url": "0",
        "recipients": [
            {
                "mobiles": phone_clean,
                "otp": otp,
                "OTP": otp,
            }
        ],
    }
    if os.getenv("MSG91_FLOW_ID"):
        body["flow_id"] = flow_or_template_id
    else:
        body["template_id"] = flow_or_template_id

    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(url, json=body, headers=headers)
        resp = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if r.status_code == 200 and resp.get("type") == "success":
            return True, resp.get("message", "OTP sent")
        msg = resp.get("message", resp.get("description", r.text or f"HTTP {r.status_code}"))
        logger.warning("MSG91 v5 API response: status=%s body=%s", r.status_code, resp)
        return False, msg
    except Exception as e:
        logger.exception("MSG91 v5 API exception: %s", e)
        return False, str(e)
