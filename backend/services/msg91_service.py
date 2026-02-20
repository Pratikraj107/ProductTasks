"""
MSG91 OTP service - send OTP via MSG91 API.
API: https://api.msg91.com/api/sendotp.php (GET)
"""
import os
import urllib.parse
import urllib.request
import json


def send_otp(phone: str, otp: str, sender_id: str | None = None) -> tuple[bool, str]:
    """
    Send OTP to phone via MSG91.
    Phone must be in international format (e.g. 919876543210 for India).
    Returns (success: bool, message: str).
    """
    auth_key = os.getenv("MSG91_AUTH_KEY")
    if not auth_key:
        return False, "MSG91_AUTH_KEY not configured"

    # Remove any + or spaces from phone
    phone_clean = phone.replace("+", "").replace(" ", "").strip()
    if not phone_clean.isdigit():
        return False, "Invalid phone number"

    params = {
        "authkey": auth_key,
        "mobile": phone_clean,
        "otp": otp,
    }
    if sender_id:
        params["sender"] = sender_id[:6]  # MSG91 sender ID max 6 chars
    # Optional: custom message with ##OTP## placeholder
    # params["message"] = "Your verification code is ##OTP##"

    query = urllib.parse.urlencode(params)
    url = f"https://api.msg91.com/api/sendotp.php?{query}"

    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode()
            # MSG91 returns JSON like {"type":"success","message":"..."} or {"type":"error","message":"..."}
            try:
                data = json.loads(body)
                if data.get("type") == "success":
                    return True, data.get("message", "OTP sent")
                return False, data.get("message", "Failed to send OTP")
            except json.JSONDecodeError:
                if "success" in body.lower() or "sent" in body.lower():
                    return True, "OTP sent"
                return False, body or "Unknown response"
    except urllib.error.HTTPError as e:
        return False, f"HTTP error: {e.code}"
    except urllib.error.URLError as e:
        return False, str(e.reason) if getattr(e, "reason", None) else "Network error"
    except Exception as e:
        return False, str(e)
