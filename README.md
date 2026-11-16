# Brown Capital CRM

AI-powered CRM for financial advisory — auto-calls leads via VAPI, sends personalized emails via Claude AI + Gmail SMTP, full Kanban pipeline, task management, team management.

## Quick Start

### 1. Supabase
- Database is already created via MCP (project: `hdbqucwwfibjmckdfxxa`)
- Get your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from the Supabase dashboard

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

App runs at http://localhost:3000

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (Settings → API) |
| `VAPI_API_KEY` | From vapi.ai dashboard |
| `VAPI_ASSISTANT_ID` | Your VAPI assistant ID |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASSWORD` | Gmail App Password (not your login password) |
| `FROM_EMAIL` | Sender email |
| `FROM_NAME` | `Jarrod Brown` |

### Gmail App Password Setup
1. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords
2. Create app password for "Mail"
3. Use that 16-character password as `SMTP_PASSWORD`

## Features
- **Dashboard** — stats, pipeline overview, recent leads
- **Pipeline** — drag-and-drop Kanban (New → Called → Emailed → Qualified → Closed)  
- **Lead Detail** — full profile, call now, send email, tasks, activity timeline
- **Tasks** — all tasks with filters by member and status
- **Team** — manage team members with role and assignment counts
- **Settings** — credential configuration guide
- **Lead Form** — public capture form at `/form` that triggers full automation

## Automation Flow
1. Lead submits form → `POST /leads`
2. VAPI AI places phone call automatically
3. Claude generates personalized email → sent via Gmail SMTP
4. All activity logged in Supabase
5. Dashboard updates in real-time
