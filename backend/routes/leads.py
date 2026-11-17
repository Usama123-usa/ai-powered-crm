from fastapi import APIRouter, HTTPException, BackgroundTasks
from database.supabase_client import supabase
from models.schemas import LeadCreate, LeadUpdate
from services import vapi_service, email_service, claude_service

router = APIRouter()


async def _trigger_automation(lead_id: str, phone: str, name: str, email: str, company: str, source: str):
    try:
        call_result = await vapi_service.initiate_call(
            phone_number=phone,
            lead_name=name,
            lead_id=lead_id,
        )
        vapi_call_id = call_result.get("id")
        supabase.table("calls").insert({
            "lead_id": lead_id,
            "vapi_call_id": vapi_call_id,
            "status": "initiated",
        }).execute()
        supabase.table("activities").insert({
            "lead_id": lead_id,
            "type": "call",
            "note": f"AI call initiated to {phone}",
        }).execute()
        supabase.table("leads").update({"stage": "called"}).eq("id", lead_id).execute()
    except Exception as e:
        print(f"VAPI call error: {e}")

    try:
        email_data = claude_service.generate_email(
            lead_name=name,
            company=company or "",
            source=source or "website",
        )
        sent = email_service.send_email(
            to_email=email,
            subject=email_data["subject"],
            body=email_data["body"],
        )
        if sent:
            supabase.table("emails_sent").insert({
                "lead_id": lead_id,
                "subject": email_data["subject"],
                "body": email_data["body"],
            }).execute()
            supabase.table("activities").insert({
                "lead_id": lead_id,
                "type": "email",
                "note": f"Personalized email sent: {email_data['subject']}",
            }).execute()
            supabase.table("leads").update({"stage": "emailed"}).eq("id", lead_id).execute()
    except Exception as e:
        print(f"Email error: {e}")


@router.post("/leads")
async def create_lead(lead: LeadCreate):
    # Save lead only — automation triggers on Step 2 (PATCH with notes/industry)
    data = lead.model_dump(exclude_none=True)
    result = supabase.table("leads").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create lead")
    return result.data[0]


@router.get("/leads")
def get_leads():
    result = supabase.table("leads").select("*, team_members(id, name, avatar_url)").order("created_at", desc=True).execute()
    return result.data


@router.get("/leads/{lead_id}")
def get_lead(lead_id: str):
    result = supabase.table("leads").select("*, team_members(id, name, avatar_url)").eq("id", lead_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = result.data
    lead["activities"] = supabase.table("activities").select("*").eq("lead_id", lead_id).order("created_at", desc=True).execute().data
    lead["calls"] = supabase.table("calls").select("*").eq("lead_id", lead_id).order("created_at", desc=True).execute().data
    lead["emails"] = supabase.table("emails_sent").select("*").eq("lead_id", lead_id).order("sent_at", desc=True).execute().data
    lead["tasks"] = supabase.table("tasks").select("*, team_members(id, name)").eq("lead_id", lead_id).order("created_at", desc=True).execute().data
    return lead


@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, lead: LeadUpdate, background_tasks: BackgroundTasks):
    data = lead.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("leads").update(data).eq("id", lead_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    updated = result.data[0]
    # Log stage change activity
    if "stage" in data:
        supabase.table("activities").insert({
            "lead_id": lead_id,
            "type": "stage_change",
            "note": f"Stage changed to {data['stage']}",
        }).execute()
    # Trigger automation only when Step 2 completes (notes field sent by form)
    if "notes" in data:
        # Fetch full lead to get phone/email (PATCH only returns updated fields)
        full = supabase.table("leads").select("*").eq("id", lead_id).single().execute()
        lead_full = full.data or {}
        if lead_full.get("phone") and lead_full.get("email"):
            background_tasks.add_task(
                _trigger_automation,
                lead_id=lead_id,
                phone=lead_full["phone"],
                name=lead_full["name"],
                email=lead_full["email"],
                company=lead_full.get("company", ""),
                source=lead_full.get("source", "website"),
            )
    return updated


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    supabase.table("leads").delete().eq("id", lead_id).execute()
    return {"message": "Lead deleted"}
