from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    company: Optional[str] = None
    source: Optional[str] = "website"
    score: Optional[str] = "warm"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    stage: Optional[str] = None
    score: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None


class TaskCreate(BaseModel):
    lead_id: Optional[str] = None
    assigned_to: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    status: Optional[str] = "pending"


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None


class TeamMemberCreate(BaseModel):
    name: str
    email: str
    role: Optional[str] = "agent"
    avatar_url: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None


class CallInitiate(BaseModel):
    lead_id: str


class EmailSend(BaseModel):
    lead_id: str
    subject: Optional[str] = None
    body: Optional[str] = None


class ActivityCreate(BaseModel):
    lead_id: str
    type: str
    note: Optional[str] = None
    created_by: Optional[str] = None
