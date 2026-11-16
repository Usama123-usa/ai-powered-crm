from fastapi import APIRouter, HTTPException
from database.supabase_client import supabase
from models.schemas import TeamMemberCreate, TeamMemberUpdate

router = APIRouter()


@router.post("/team")
def create_team_member(member: TeamMemberCreate):
    data = member.model_dump(exclude_none=True)
    result = supabase.table("team_members").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create team member")
    return result.data[0]


@router.get("/team")
def get_team():
    members = supabase.table("team_members").select("*").order("created_at").execute().data
    for member in members:
        member["leads_count"] = len(supabase.table("leads").select("id").eq("assigned_to", member["id"]).execute().data)
        member["tasks_count"] = len(supabase.table("tasks").select("id").eq("assigned_to", member["id"]).execute().data)
    return members


@router.patch("/team/{member_id}")
def update_team_member(member_id: str, member: TeamMemberUpdate):
    data = member.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("team_members").update(data).eq("id", member_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Team member not found")
    return result.data[0]


@router.delete("/team/{member_id}")
def delete_team_member(member_id: str):
    supabase.table("team_members").delete().eq("id", member_id).execute()
    return {"message": "Team member deleted"}
