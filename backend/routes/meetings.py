from fastapi import APIRouter, HTTPException
from database.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timedelta

router = APIRouter()

# Available time slots 9am-5pm Mon-Fri
TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
]


class MeetingCreate(BaseModel):
    lead_id: str
    meeting_date: str
    meeting_time: str
    title: Optional[str] = "Discovery Call with Jarrod Brown"
    duration_minutes: Optional[int] = 20
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class MeetingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    meeting_date: Optional[str] = None
    meeting_time: Optional[str] = None


@router.get("/meetings/slots")
def get_available_slots(date_str: str = None):
    """Return available time slots for next 14 days (Mon-Fri only)"""
    today = datetime.now().date()
    available_days = []
    day = today + timedelta(days=1)

    while len(available_days) < 10:
        if day.weekday() < 5:  # Mon-Fri only
            # Get booked slots for this day
            booked = supabase.table("meetings")\
                .select("meeting_time")\
                .eq("meeting_date", str(day))\
                .eq("status", "scheduled")\
                .execute().data
            booked_times = [b["meeting_time"] for b in booked]
            free_slots = [t for t in TIME_SLOTS if t not in booked_times]

            if free_slots:
                available_days.append({
                    "date": str(day),
                    "day_name": day.strftime("%A"),
                    "display": day.strftime("%B %d, %Y"),
                    "slots": free_slots
                })
        day += timedelta(days=1)

    return available_days


@router.post("/meetings")
def create_meeting(meeting: MeetingCreate):
    # Check slot still available
    existing = supabase.table("meetings")\
        .select("id")\
        .eq("meeting_date", meeting.meeting_date)\
        .eq("meeting_time", meeting.meeting_time)\
        .eq("status", "scheduled")\
        .execute().data
    if existing:
        raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another time.")

    data = meeting.model_dump(exclude_none=True)
    result = supabase.table("meetings").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to book meeting")

    # Update lead score to warm if cold, log activity
    lead = supabase.table("leads").select("score").eq("id", meeting.lead_id).single().execute().data
    if lead and lead.get("score") == "cold":
        supabase.table("leads").update({"score": "warm"}).eq("id", meeting.lead_id).execute()

    supabase.table("activities").insert({
        "lead_id": meeting.lead_id,
        "type": "task",
        "note": f"Meeting booked: {meeting.title} on {meeting.meeting_date} at {meeting.meeting_time}",
    }).execute()

    return result.data[0]


@router.get("/meetings")
def get_all_meetings():
    result = supabase.table("meetings")\
        .select("*, leads(id, name, email, company, score), team_members(id, name)")\
        .order("meeting_date")\
        .order("meeting_time")\
        .execute()
    return result.data


@router.get("/meetings/lead/{lead_id}")
def get_meetings_by_lead(lead_id: str):
    result = supabase.table("meetings")\
        .select("*")\
        .eq("lead_id", lead_id)\
        .order("meeting_date")\
        .execute()
    return result.data


@router.patch("/meetings/{meeting_id}")
def update_meeting(meeting_id: str, update: MeetingUpdate):
    data = update.model_dump(exclude_none=True)
    result = supabase.table("meetings").update(data).eq("id", meeting_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return result.data[0]


@router.delete("/meetings/{meeting_id}")
def cancel_meeting(meeting_id: str):
    supabase.table("meetings").update({"status": "cancelled"}).eq("id", meeting_id).execute()
    return {"message": "Meeting cancelled"}
