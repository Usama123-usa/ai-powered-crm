from fastapi import APIRouter, HTTPException
from database.supabase_client import supabase
from models.schemas import EmailSend
from services import email_service, claude_service

router = APIRouter()


@router.post("/emails/send")
def send_email(payload: EmailSend):
    lead = supabase.table("leads").select("*").eq("id", payload.lead_id).single().execute()
    if not lead.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead_data = lead.data

    if payload.subject and payload.body:
        subject = payload.subject
        body = payload.body
    else:
        email_data = claude_service.generate_email(
            lead_name=lead_data["name"],
            company=lead_data.get("company", ""),
            source=lead_data.get("source", "website"),
        )
        subject = email_data["subject"]
        body = email_data["body"]

    sent = email_service.send_email(
        to_email=lead_data["email"],
        subject=subject,
        body=body,
    )
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email")

    record = supabase.table("emails_sent").insert({
        "lead_id": payload.lead_id,
        "subject": subject,
        "body": body,
    }).execute()
    supabase.table("activities").insert({
        "lead_id": payload.lead_id,
        "type": "email",
        "note": f"Email sent: {subject}",
    }).execute()
    supabase.table("leads").update({"stage": "emailed"}).eq("id", payload.lead_id).execute()
    return record.data[0]


@router.get("/emails/lead/{lead_id}")
def get_emails(lead_id: str):
    result = supabase.table("emails_sent").select("*").eq("lead_id", lead_id).order("sent_at", desc=True).execute()
    return result.data
