import os
import httpx
from dotenv import load_dotenv

load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
VAPI_BASE_URL = "https://api.vapi.ai"

async def initiate_call(phone_number: str, lead_name: str, lead_id: str) -> dict:
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
            # Outbound-specific first message so Aria knows this is an outbound call.
            # Inbound calls have no firstMessage — the assistant waits for the caller.
            "firstMessage": "Hello, my name is Aria, I'm calling on behalf of Jarrod Brown from Brown Capital — is this a good time to talk?",
            "variableValues": {
                "name": lead_name,
                "lead_id": lead_id,
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
