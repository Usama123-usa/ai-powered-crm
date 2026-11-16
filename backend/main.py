from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import leads, tasks, team, calls, emails, analytics, meetings, vapi_tools
from mangum import Mangum

app = FastAPI(title="Brown Capital CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router, tags=["Leads"])
app.include_router(tasks.router, tags=["Tasks"])
app.include_router(team.router, tags=["Team"])
app.include_router(calls.router, tags=["Calls"])
app.include_router(emails.router, tags=["Emails"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(meetings.router, tags=["Meetings"])
app.include_router(vapi_tools.router, tags=["VAPI Tools"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Brown Capital CRM"}


# Vercel serverless handler
handler = Mangum(app, lifespan="off")
