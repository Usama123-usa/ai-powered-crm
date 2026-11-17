import os
import httpx
from dotenv import load_dotenv

load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
VAPI_BASE_URL = "https://api.vapi.ai"

def _format_phone(phone: str) -> str:
    """Ensure E.164 format for VAPI: +[country][number]"""
    digits = ''.join(c for c in phone if c.isdigit())
    if phone.startswith('+'):
        return '+' + digits
    # Pakistan numbers: 03xx -> +923xx
    if digits.startswith('0') and len(digits) == 11:
        return '+92' + digits[1:]
    # Already has country code (no leading 0)
    if len(digits) >= 10:
        return '+' + digits
    return phone

async def initiate_call(phone_number: str, lead_name: str, lead_id: str,
                        email: str = "", company: str = "",
                        industry: str = "", service: str = "") -> dict:
    phone_number = _format_phone(phone_number)
    phone_last4 = phone_number[-4:] if len(phone_number) >= 4 else phone_number
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "assistantId": VAPI_ASSISTANT_ID,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": phone_number,
            "name": lead_name,
        },
        "assistantOverrides": {
            "firstMessage": f"Hi, is this {lead_name}? Great — I'm Aria from Brown Capital, just calling to confirm your details real quick. Takes 30 seconds!",
            "variableValues": {
                "name": lead_name,
                "lead_id": lead_id,
                "email": email,
                "phone_last4": phone_last4,
                "company": company or "your company",
                "industry": industry or "your industry",
                "service": service or "our services",
                "call_type": "outbound",
            }
        },
        "metadata": {
            "lead_id": lead_id,
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/call/phone",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
