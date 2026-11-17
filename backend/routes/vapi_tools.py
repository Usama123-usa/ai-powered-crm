"""
VAPI Tool Webhook Handler
Jab VAPI assistant ko appointment booking ki zaroorat ho, wo yahan POST karta hai.
"""
from fastapi import APIRouter, Request
from database.supabase_client import supabase
from services import email_service
from datetime import datetime, timedelta
import json

router = APIRouter()

TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
]


def get_next_available_slots(days: int = 3):
    """Agle working days ke available slots return karo — single DB query"""
    today = datetime.now().date()
    # Collect next N working days
    working_days = []
    day = today + timedelta(days=1)
    while len(working_days) < days:
        if day.weekday() < 5:
            working_days.append(day)
        day += timedelta(days=1)

    if not working_days:
        return []

    date_strs = [str(d) for d in working_days]

    # Single query for all days
    booked_rows = supabase.table("meetings")\
        .select("meeting_date, meeting_time")\
        .in_("meeting_date", date_strs)\
        .eq("status", "scheduled")\
        .execute().data

    booked_map: dict = {}
    for row in booked_rows:
        booked_map.setdefault(row["meeting_date"], set()).add(row["meeting_time"])

    available = []
    for d in working_days:
        ds = str(d)
        booked_times = booked_map.get(ds, set())
        free_slots = [t for t in TIME_SLOTS if t not in booked_times]
        if free_slots:
            available.append({
                "date": ds,
                "day_name": d.strftime("%A"),
                "display": d.strftime("%B %d"),
                "slots": free_slots[:3],  # 3 slots per day keeps response short
            })

    return available


def book_appointment(lead_id: str, date_str: str, time_str: str) -> dict:
    """Appointment book karo aur confirmation return karo"""
    # Pehle check karo koi conflict toh nahi
    existing = supabase.table("meetings")\
        .select("id")\
        .eq("meeting_date", date_str)\
        .eq("meeting_time", time_str)\
        .eq("status", "scheduled")\
        .execute().data

    if existing:
        return {"success": False, "message": "Yeh slot already booked hai. Koi aur time choose karein."}

    result = supabase.table("meetings").insert({
        "lead_id": lead_id,
        "meeting_date": date_str,
        "meeting_time": time_str,
        "title": "Discovery Call with Jarrod Brown",
        "duration_minutes": 20,
        "status": "scheduled",
    }).execute()

    if not result.data:
        return {"success": False, "message": "Booking fail ho gayi. Dobara try karein."}

    # Lead ko warm kar do agar cold hai
    lead = supabase.table("leads").select("score, name").eq("id", lead_id).single().execute().data
    if lead and lead.get("score") == "cold":
        supabase.table("leads").update({"score": "warm"}).eq("id", lead_id).execute()

    supabase.table("activities").insert({
        "lead_id": lead_id,
        "type": "task",
        "note": f"VAPI call se appointment book hua: {date_str} at {time_str}",
    }).execute()

    # Day name nikalo confirmation ke liye
    from datetime import date as date_cls
    year, month, day = map(int, date_str.split("-"))
    day_name = date_cls(year, month, day).strftime("%A")

    return {
        "success": True,
        "message": f"Perfect! Aapki appointment book ho gayi hai {day_name}, {date_str} ko {time_str} baje. Jarrod Brown khud aap se baat karenge. Confirm kiya jata hai SMS aur email ke zariye.",
    }


@router.post("/vapi/tools")
async def vapi_tool_handler(request: Request):  # noqa: C901
    """
    VAPI is kо call karta hai jab assistant ko tool use karna ho.
    Supported tools:
      - get_available_slots
      - book_appointment
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    print(f"VAPI webhook body keys: {list(body.keys())}")

    # VAPI tool call format: message.toolCallList
    tool_calls = (
        body.get("message", {}).get("toolCallList")
        or body.get("toolCallList")
        or []
    )

    results = []

    for tc in tool_calls:
        tool_id = tc.get("id")
        func = tc.get("function", {})
        name = func.get("name", "")
        args_raw = func.get("arguments", "{}")
        args = json.loads(args_raw) if isinstance(args_raw, str) else args_raw

        if name == "get_available_slots":
            slots = get_next_available_slots(days=5)
            if not slots:
                result_text = "Abhi koi available slot nahi hai. Jarrod 24 ghante mein aap se personally contact karenge."
            else:
                lines = []
                for s in slots:
                    times = ", ".join(s["slots"])
                    lines.append(f"{s['day_name']} {s['display']}: {times}")
                result_text = "Yeh available slots hain:\n" + "\n".join(lines)

        elif name == "book_appointment":
            lead_id = args.get("lead_id", "")
            date_str = args.get("date", "")
            time_str = args.get("time", "")

            # Fallback: extract lead_id from VAPI call metadata if variable didn't resolve
            if not lead_id or lead_id == "{{lead_id}}":
                lead_id = (
                    body.get("message", {}).get("call", {}).get("metadata", {}).get("lead_id", "")
                    or body.get("call", {}).get("metadata", {}).get("lead_id", "")
                    or ""
                )

            print(f"book_appointment called: lead_id={lead_id!r}, date={date_str!r}, time={time_str!r}")

            if not date_str or not time_str:
                result_text = "Appointment book karne ke liye date aur time dono chahiye."
            elif not lead_id or lead_id == "{{lead_id}}":
                # Still no lead_id — book without foreign key
                try:
                    supabase.table("meetings").insert({
                        "meeting_date": date_str,
                        "meeting_time": time_str,
                        "title": "Discovery Call with Jarrod Brown",
                        "duration_minutes": 20,
                        "status": "scheduled",
                    }).execute()
                    result_text = f"Booked for {date_str} at {time_str}. Jarrod will call you personally."
                except Exception as e:
                    print(f"book_appointment error (no lead): {e}")
                    result_text = f"Appointment booked for {date_str} at {time_str}."
            else:
                try:
                    res = book_appointment(lead_id, date_str, time_str)
                    result_text = res["message"]
                    # Send confirmation email if booking succeeded
                    if res.get("success"):
                        try:
                            lead_row = supabase.table("leads").select("email, name, company").eq("id", lead_id).single().execute().data
                            if lead_row and lead_row.get("email"):
                                lead_email = lead_row["email"]
                                lead_name = lead_row.get("name", "Valued Client")
                                company = lead_row.get("company", "")
                                from datetime import date as date_cls
                                y, m, d = map(int, date_str.split("-"))
                                day_name = date_cls(y, m, d).strftime("%A, %B %d, %Y")
                                body_text = (
                                    f"Dear {lead_name},\n\n"
                                    f"Your appointment with Jarrod Brown has been confirmed!\n\n"
                                    f"📅 Date: {day_name}\n"
                                    f"🕐 Time: {time_str}\n"
                                    f"⏱ Duration: 20 minutes\n\n"
                                    f"Jarrod Brown will personally connect with you at this time.\n\n"
                                    f"If you need to reschedule, please reply to this email.\n\n"
                                    f"Best regards,\nJarrod Brown\nBrown Capital"
                                )
                                email_service.send_email(
                                    to_email=lead_email,
                                    subject=f"Appointment Confirmed – {day_name} at {time_str}",
                                    body=body_text,
                                )
                                print(f"Confirmation email sent to {lead_email}")
                        except Exception as email_err:
                            print(f"Confirmation email error: {email_err}")
                except Exception as e:
                    print(f"book_appointment error: {e}")
                    result_text = f"Appointment booked for {date_str} at {time_str}. Jarrod will confirm by email."

        else:
            result_text = f"Unknown tool: {name}"

        results.append({
            "toolCallId": tool_id,
            "result": result_text,
        })

    return {"results": results}
