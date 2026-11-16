from fastapi import APIRouter, HTTPException, Request
from database.supabase_client import supabase
from models.schemas import CallInitiate
import asyncio
from services import vapi_service

router = APIRouter()


@router.post("/calls/initiate")
async def initiate_call(payload: CallInitiate):
    lead = supabase.table("leads").select("*").eq("id", payload.lead_id).single().execute()
    if not lead.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead_data = lead.data
    try:
        call_result = await vapi_service.initiate_call(
            phone_number=lead_data["phone"],
            lead_name=lead_data["name"],
            lead_id=payload.lead_id,
        )
        vapi_call_id = call_result.get("id")
        db_call = supabase.table("calls").insert({
            "lead_id": payload.lead_id,
            "vapi_call_id": vapi_call_id,
            "status": "initiated",
        }).execute()
        supabase.table("activities").insert({
            "lead_id": payload.lead_id,
            "type": "call",
            "note": f"Manual call initiated to {lead_data['phone']}",
        }).execute()
        supabase.table("leads").update({"stage": "called"}).eq("id", payload.lead_id).execute()
        return db_call.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calls/webhook")
async def call_webhook(request: Request):
    body = await request.json()
    vapi_call_id = body.get("call", {}).get("id") or body.get("callId")
    status_map = {
        "call-started": "in_progress",
        "call-ended": "completed",
        "call-failed": "failed",
    }
    message_type = body.get("message", {}).get("type", "")
    new_status = status_map.get(message_type)
    duration = body.get("call", {}).get("duration")

    if vapi_call_id and new_status:
        update_data = {"status": new_status}
        if duration:
            update_data["duration"] = duration
        supabase.table("calls").update(update_data).eq("vapi_call_id", vapi_call_id).execute()

    return {"received": True}


@router.get("/calls/lead/{lead_id}")
def get_calls(lead_id: str):
    result = supabase.table("calls").select("*").eq("lead_id", lead_id).order("created_at", desc=True).execute()
    return result.data
