from fastapi import APIRouter, HTTPException, BackgroundTasks
from database.supabase_client import supabase
from models.schemas import LeadCreate, LeadUpdate
from services import vapi_service, email_service, claude_service

router = APIRouter()


@router.post("/leads")
async def create_lead(lead: LeadCreate, background_tasks: BackgroundTasks):
    # Save lead
    data = lead.model_dump(exclude_none=True)
    result = supabase.table("leads").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create lead")

    new_lead = result.data[0]
    lead_id = new_lead["id"]

    # Background: trigger VAPI call
    async def trigger_automation():
        # Initiate call
        try:
            call_result = await vapi_service.initiate_call(
                phone_number=lead.phone,
                lead_name=lead.name,
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
                "note": f"AI call initiated to {lead.phone}",
            }).execute()
            # Update stage
            supabase.table("leads").update({"stage": "called"}).eq("id", lead_id).execute()
        except Exception as e:
            print(f"VAPI call error: {e}")

        # Generate and send email
        try:
            email_data = claude_service.generate_email(
                lead_name=lead.name,
                company=lead.company or "",
                source=lead.source or "website",
            )
            sent = email_service.send_email(
                to_email=lead.email,
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

    background_tasks.add_task(trigger_automation)
    return new_lead


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
def update_lead(lead_id: str, lead: LeadUpdate):
    data = lead.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("leads").update(data).eq("id", lead_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Log stage change activity
    if "stage" in data:
        supabase.table("activities").insert({
            "lead_id": lead_id,
            "type": "stage_change",
            "note": f"Stage changed to {data['stage']}",
        }).execute()
    return result.data[0]


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    supabase.table("leads").delete().eq("id", lead_id).execute()
    return {"message": "Lead deleted"}
