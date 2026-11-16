from fastapi import APIRouter, HTTPException
from database.supabase_client import supabase
from models.schemas import TaskCreate, TaskUpdate

router = APIRouter()


@router.post("/tasks")
def create_task(task: TaskCreate):
    data = task.model_dump(exclude_none=True)
    result = supabase.table("tasks").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create task")
    if task.lead_id:
        supabase.table("activities").insert({
            "lead_id": task.lead_id,
            "type": "task",
            "note": f"Task created: {task.title}",
        }).execute()
    return result.data[0]


@router.get("/tasks")
def get_tasks(assigned_to: str = None, status: str = None):
    query = supabase.table("tasks").select("*, leads(id, name, company), team_members(id, name, avatar_url)")
    if assigned_to:
        query = query.eq("assigned_to", assigned_to)
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/tasks/lead/{lead_id}")
def get_tasks_by_lead(lead_id: str):
    result = supabase.table("tasks").select("*, team_members(id, name, avatar_url)").eq("lead_id", lead_id).order("created_at", desc=True).execute()
    return result.data


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, task: TaskUpdate):
    data = task.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("tasks").update(data).eq("id", task_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data[0]


@router.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    supabase.table("tasks").delete().eq("id", task_id).execute()
    return {"message": "Task deleted"}


@router.post("/tasks/sync-from-leads")
def sync_tasks_from_leads():
    """Auto-create follow-up tasks for leads that don't have any task yet."""
    # Get all leads that are not closed/lost
    leads_res = supabase.table("leads").select("id, name, stage, assigned_to").not_.in_(
        "stage", ["closed", "lost"]
    ).execute()
    leads = leads_res.data or []

    # Get lead_ids that already have tasks
    existing_res = supabase.table("tasks").select("lead_id").not_.is_("lead_id", "null").execute()
    existing_lead_ids = {r["lead_id"] for r in (existing_res.data or [])}

    # Get team members for round-robin assignment
    team_res = supabase.table("team_members").select("id, name").execute()
    team = team_res.data or []

    created = []
    team_index = 0

    for lead in leads:
        if lead["id"] in existing_lead_ids:
            continue

        # Assign to lead's assigned_to or round-robin from team
        assigned = lead.get("assigned_to")
        if not assigned and team:
            assigned = str(team[team_index % len(team)]["id"])
            team_index += 1

        stage = lead.get("stage", "new")
        stage_labels = {
            "new": "Review new lead",
            "contacted": "Follow up with",
            "qualified": "Schedule call with",
            "emailed": "Confirm appointment with",
        }
        prefix = stage_labels.get(stage, "Follow up with")

        task_data = {
            "lead_id": lead["id"],
            "title": f"{prefix} {lead['name']}",
            "status": "pending",
            "priority": "medium" if stage == "new" else "high",
        }
        if assigned:
            task_data["assigned_to"] = assigned

        result = supabase.table("tasks").insert(task_data).execute()
        if result.data:
            created.append(result.data[0])

    return {"created": len(created), "tasks": created}
