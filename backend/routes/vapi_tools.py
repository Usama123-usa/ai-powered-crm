"""
VAPI Tool Webhook Handler
Jab VAPI assistant ko appointment booking ki zaroorat ho, wo yahan POST karta hai.
"""
from fastapi import APIRouter, Request
from database.supabase_client import supabase
from datetime import datetime, timedelta
import json

router = APIRouter()

TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
]


def get_next_available_slots(days: int = 5):
    """Agle 5 working days ke available slots return karo"""
    today = datetime.now().date()
    available = []
    day = today + timedelta(days=1)

    while len(available) < days:
        if day.weekday() < 5:  # Mon-Fri only
            booked = supabase.table("meetings")\
                .select("meeting_time")\
                .eq("meeting_date", str(day))\
                .eq("status", "scheduled")\
                .execute().data
            booked_times = [b["meeting_time"] for b in booked]
            free_slots = [t for t in TIME_SLOTS if t not in booked_times]

            if free_slots:
                available.append({
                    "date": str(day),
                    "day_name": day.strftime("%A"),
                    "display": day.strftime("%B %d"),
                    # Sirf pehle 4 slots show karo call mein
                    "slots": free_slots[:4],
                })
        day += timedelta(days=1)

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
async def vapi_tool_handler(request: Request):
    """
    VAPI is kо call karta hai jab assistant ko tool use karna ho.
    Supported tools:
      - get_available_slots
      - book_appointment
    """
    body = await request.json()

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

            if not lead_id or not date_str or not time_str:
                result_text = "Appointment book karne ke liye date aur time dono chahiye."
            else:
                res = book_appointment(lead_id, date_str, time_str)
                result_text = res["message"]

        else:
            result_text = f"Unknown tool: {name}"

        results.append({
            "toolCallId": tool_id,
            "result": result_text,
        })

    return {"results": results}
