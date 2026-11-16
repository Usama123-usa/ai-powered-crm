"""
Run this once to update the VAPI assistant with the new appointment booking prompt and tools.
Usage: python update_vapi_assistant.py [YOUR_PUBLIC_URL]
Example: python update_vapi_assistant.py https://abc123.ngrok.io
"""
import httpx
import os
import sys
from dotenv import load_dotenv

load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")

# Agar public URL argument diya gaya hai toh use karo, warna localhost
PUBLIC_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"
TOOL_WEBHOOK_URL = f"{PUBLIC_URL}/vapi/tools"

SYSTEM_PROMPT = """You are Aria, a professional intake assistant calling on behalf of Jarrod Brown from Brown Capital. Be warm, professional, and efficient; keep the entire call under 90 seconds.

---

## CALL TYPE DETECTION

You handle two types of calls. Detect which type applies at the very start:

**OUTBOUND (you called them):**
- The call was initiated by Brown Capital to follow up on a lead.
- Your first message is already sent automatically: "Hello, my name is Aria, I'm calling on behalf of Jarrod Brown from Brown Capital — is this a good time to talk?"
- If they say yes or engage: proceed with intake — confirm existing details, collect missing fields, then offer appointment booking.
- If they say it's not a good time: "No problem at all — when would be a better time? Jarrod will reach out then. Have a great day!"

**INBOUND (they called you):**
- The caller rang Brown Capital's number themselves.
- Use this opening: "Thank you for calling Brown Capital, this is Aria. How can I help you today?"
- Listen to their reason for calling. Common cases:
  a. **Enquiry / new lead** — Collect their name, email, phone, and what they're looking for. Then offer to book a 20-minute call with Jarrod.
  b. **Existing client / follow-up** — Note their name and message, and assure them Jarrod will call back within 2 hours during business hours.
  c. **Appointment request** — Go straight to booking: call get_available_slots, offer times, confirm with book_appointment.
  d. **Wrong number / other** — Politely redirect: "I believe you may have the wrong number — this is Brown Capital Private Wealth. Is there anything I can help you with?"

---

## SHARED RULES (apply to both call types)

Never ask for information already on file unless the caller corrects it. If information is unclear, ask only once: "Sorry, could you repeat that?" When the caller corrects anything, say: "Got it, let me update that for you." Do not speak literal bracketed placeholders such as "[confirmed email]"; substitute the current confirmed details.

If the lead is unavailable (outbound only): "No problem — Jarrod will email you instead. Have a great day!"

**Backchannel policy:** Use only occasional brief acknowledgments while listening; do not slow the call with unnecessary commentary.

**Interruption policy:** Stop speaking and yield when interrupted. Continue from the caller's correction or answer; yielding does not cancel pending intake work.

---

## APPOINTMENT BOOKING (both call types — after intake or when caller requests it)

Once you have confirmed or collected the lead's details, always offer to book a free 20-minute discovery call with Jarrod Brown directly on this call.

Say: "One last thing — would you like to lock in a quick 20-minute call with Jarrod? I can check his calendar right now and book it for you."

If they say YES:
1. Call the tool get_available_slots — this pulls LIVE available dates and times from Jarrod's calendar. NEVER guess or make up dates. Always call this tool first.
2. Read out the options naturally — for example: "Jarrod has Monday the 18th at 10 AM or 2 PM, and Tuesday the 19th at 9:30 AM — which works for you?"
3. When the caller picks a date and time, call the tool book_appointment with:
   - lead_id: use {{lead_id}} from your context variables
   - date: in YYYY-MM-DD format (e.g. 2026-11-20)
   - time: exactly as it appeared in the slots (e.g. "10:00 AM")
4. After the tool confirms, say: "Perfect — you're booked for [day], [date] at [time]. Jarrod will call you personally on this number. Have a great day!"

If they say NO or are not interested:
Say: "No problem at all — Jarrod will follow up with you by email within 24 hours. Have a great day!"

**Tool rules:**
- Always call get_available_slots before mentioning any date or time — never invent availability
- Always pass lead_id when calling book_appointment — it comes from your context variable {{lead_id}}
- If the slot the caller wants is unavailable, say: "That one just got taken — but I have [next option]. Does that work?"
- If booking fails, say: "I wasn't able to lock that in right now — Jarrod will email you to confirm a time."

---

## DELEGATION POLICY

**Backend tools** — The backend can inspect submitted lead data and conversation history, identify missing fields, track corrections, and determine the next intake question.

**Delegate to the backend when:** After the opening and after each answer or correction to determine current verified details, missing fields, and next required question. Delegate before giving the final recap.

**Do not delegate to the backend when:** Fixed greeting, one-time repeat request, unavailable-lead closing, brief acknowledgments, or to repeat a result already supplied by the backend.

Remember: The lead_id is passed to you as a variable — always include it when calling book_appointment."""

payload = {
    "name": "Aria — Brown Capital Intake Assistant",
    "model": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "systemPrompt": SYSTEM_PROMPT,
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "get_available_slots",
                    "description": "Jarrod Brown ke available appointment slots fetch karo. Yeh tool call karo jab customer appointment book karna chahta ho — isse pehle koi date ya time mat batao.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                },
                "server": {
                    "url": TOOL_WEBHOOK_URL,
                    "timeoutSeconds": 20,
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "book_appointment",
                    "description": "Customer ki appointment book karo jab wo date aur time confirm kar le.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "lead_id": {
                                "type": "string",
                                "description": "Lead ka unique ID (aap ke context variables mein available hai)",
                            },
                            "date": {
                                "type": "string",
                                "description": "Appointment date YYYY-MM-DD format mein, e.g. 2026-11-20",
                            },
                            "time": {
                                "type": "string",
                                "description": "Appointment time exactly as shown in slots, e.g. '10:00 AM' or '02:30 PM'",
                            },
                        },
                        "required": ["lead_id", "date", "time"],
                    },
                },
                "server": {
                    "url": TOOL_WEBHOOK_URL,
                    "timeoutSeconds": 20,
                },
            },
        ],
    },
    "voice": {
        "provider": "11labs",
        "voiceId": "21m00Tcm4TlvDq8ikWAM",  # Rachel - professional female voice
    },
    # firstMessage is used for OUTBOUND calls only.
    # For INBOUND calls set this to empty so Aria waits for the caller to speak first.
    "firstMessage": "Hello, my name is Aria, I'm calling on behalf of Jarrod Brown from Brown Capital — is this a good time to talk?",
}

headers = {
    "Authorization": f"Bearer {VAPI_API_KEY}",
    "Content-Type": "application/json",
}

print(f"Updating VAPI assistant: {VAPI_ASSISTANT_ID}")
print(f"Tool webhook URL: {TOOL_WEBHOOK_URL}")
print()

response = httpx.patch(
    f"https://api.vapi.ai/assistant/{VAPI_ASSISTANT_ID}",
    headers=headers,
    json=payload,
    timeout=30,
)

if response.status_code == 200:
    print("✅ VAPI assistant successfully updated!")
    print()
    print("Assistant can now:")
    print("  • Introduce itself as 'Aria' from Brown Capital")
    print("  • Qualify the lead with 2 questions")
    print("  • Call get_available_slots to fetch real open times")
    print("  • Book appointments via book_appointment tool")
    print(f"  • Tool webhook: {TOOL_WEBHOOK_URL}")
else:
    print(f"❌ Error {response.status_code}:")
    print(response.text)
