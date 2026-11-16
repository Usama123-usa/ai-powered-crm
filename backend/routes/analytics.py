from fastapi import APIRouter
from database.supabase_client import supabase

router = APIRouter()


@router.get("/analytics")
def get_analytics():
    total_leads = len(supabase.table("leads").select("id").execute().data)
    closed_leads = len(supabase.table("leads").select("id").eq("stage", "closed").execute().data)
    calls_made = len(supabase.table("calls").select("id").execute().data)
    emails_sent = len(supabase.table("emails_sent").select("id").execute().data)
    conversion_rate = round((closed_leads / total_leads * 100), 1) if total_leads > 0 else 0

    # Stage distribution
    stages = ["new", "called", "emailed", "qualified", "closed"]
    stage_data = []
    for stage in stages:
        count = len(supabase.table("leads").select("id").eq("stage", stage).execute().data)
        stage_data.append({"stage": stage, "count": count})

    # Score distribution
    scores = ["hot", "warm", "cold"]
    score_data = []
    for score in scores:
        count = len(supabase.table("leads").select("id").eq("score", score).execute().data)
        score_data.append({"score": score, "count": count})

    return {
        "total_leads": total_leads,
        "closed_leads": closed_leads,
        "calls_made": calls_made,
        "emails_sent": emails_sent,
        "conversion_rate": conversion_rate,
        "stage_distribution": stage_data,
        "score_distribution": score_data,
    }
