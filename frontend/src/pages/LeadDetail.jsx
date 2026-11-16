import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Building2, Globe,
  Plus, PhoneCall, Send, Check, X, Calendar
} from 'lucide-react'
import { leadsApi, tasksApi, teamApi, callsApi, emailsApi, meetingsApi } from '../lib/api'
import ScoreBadge from '../components/ScoreBadge'
import StageBadge from '../components/StageBadge'
import Avatar from '../components/Avatar'
import ActivityTimeline from '../components/ActivityTimeline'
import { format } from 'date-fns'

const STAGES = ['new', 'called', 'emailed', 'qualified', 'closed']
const SCORES = ['hot', 'warm', 'cold']

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [task, setTask] = useState({ title: '', due_date: '', assigned_to: '' })
  const [meetings, setMeetings] = useState([])
  const [slots, setSlots] = useState([])
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')

  const refresh = () => {
    leadsApi.getOne(id).then(setLead)
    meetingsApi.getByLead(id).then(setMeetings)
  }

  useEffect(() => {
    Promise.all([leadsApi.getOne(id), teamApi.getAll(), meetingsApi.getByLead(id)]).then(([l, t, m]) => {
      setLead(l); setTeam(t); setMeetings(m); setLoading(false)
    })
    meetingsApi.getSlots().then(setSlots)
  }, [id])

  const updateLead = async (field, value) => {
    const updated = await leadsApi.update(id, { [field]: value })
    setLead(prev => ({ ...prev, ...updated }))
    refresh()
  }

  const handleCall = async () => {
    setCalling(true)
    try { await callsApi.initiate(id); await refresh() }
    catch (e) { alert('Call initiation failed: ' + e.message) }
    setCalling(false)
  }

  const handleEmail = async () => {
    setEmailing(true)
    try { await emailsApi.send({ lead_id: id }); await refresh() }
    catch (e) { alert('Email failed: ' + e.message) }
    setEmailing(false)
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    await leadsApi.update(id, { notes: noteText })
    setLead(prev => ({ ...prev, notes: noteText }))
    setNoteText('')
    refresh()
  }

  const createTask = async () => {
    if (!task.title) return
    await tasksApi.create({ lead_id: id, ...task })
    setShowTaskForm(false)
    setTask({ title: '', due_date: '', assigned_to: '' })
    refresh()
  }

  const completeTask = async (taskId) => {
    await tasksApi.update(taskId, { status: 'completed' })
    refresh()
  }

  const bookMeeting = async () => {
    if (!meetingDate || !meetingTime) return
    await meetingsApi.create({ lead_id: id, meeting_date: meetingDate, meeting_time: meetingTime })
    setShowMeetingForm(false); setMeetingDate(''); setMeetingTime('')
    refresh()
  }

  const cancelMeeting = async (meetingId) => {
    await meetingsApi.cancel(meetingId)
    refresh()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!lead) return <div className="p-6 text-text-secondary">Lead not found.</div>

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-1">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile card */}
          <div className="card overflow-hidden">
            {/* Dark header */}
            <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(145deg, #17264A 0%, #0B1530 100%)' }}>
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={lead.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-display font-bold text-white leading-tight">{lead.name}</h1>
                  {lead.company && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{lead.company}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <ScoreBadge score={lead.score} stage={lead.stage} />
                    <StageBadge stage={lead.stage} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCall} disabled={calling}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D4B97E, #C6A76A)', color: 'white' }}>
                  <PhoneCall size={13} /> {calling ? 'Calling...' : 'Call Now'}
                </button>
                <button onClick={handleEmail} disabled={emailing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <Send size={13} /> {emailing ? 'Sending...' : 'Email'}
                </button>
              </div>
            </div>
            {/* Contact info */}
            <div className="p-5 space-y-2.5 text-sm">
              {lead.email && <div className="flex items-center gap-2.5 text-text-secondary">
                <Mail size={13} className="text-text-muted flex-shrink-0" /> {lead.email}
              </div>}
              {lead.phone && <div className="flex items-center gap-2.5 text-text-secondary">
                <Phone size={13} className="text-text-muted flex-shrink-0" /> {lead.phone}
              </div>}
              {lead.company && <div className="flex items-center gap-2.5 text-text-secondary">
                <Building2 size={13} className="text-text-muted flex-shrink-0" /> {lead.company}
              </div>}
              {lead.source && <div className="flex items-center gap-2.5 text-text-secondary">
                <Globe size={13} className="text-text-muted flex-shrink-0" /> {lead.source}
              </div>}
            </div>
          </div>

          {/* Stage & Score controls */}
          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Stage</label>
              <select value={lead.stage} onChange={e => updateLead('stage', e.target.value)} className="input text-sm">
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lead Score</label>
              <select value={lead.score} onChange={e => updateLead('score', e.target.value)} className="input text-sm">
                {SCORES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assigned To</label>
              <select value={lead.assigned_to || ''} onChange={e => updateLead('assigned_to', e.target.value || null)} className="input text-sm">
                <option value="">Unassigned</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <label className="label">Notes</label>
            <textarea
              className="input resize-none text-sm"
              rows={4}
              placeholder="Add notes about this lead..."
              value={noteText || lead.notes || ''}
              onChange={e => setNoteText(e.target.value)}
            />
            <button onClick={addNote} className="btn-primary mt-2 text-xs w-full justify-center">
              Save Note
            </button>
          </div>
        </div>

        {/* Right: Activity, Tasks, Calls, Emails */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="section-title">Tasks</h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-ghost text-xs py-1">
                <Plus size={13} /> Add Task
              </button>
            </div>
            {showTaskForm && (
              <div className="px-5 py-4 bg-app border-b border-border space-y-3">
                <input className="input text-sm" placeholder="Task title..." value={task.title} onChange={e => setTask(p => ({ ...p, title: e.target.value }))} />
                <div className="flex gap-2">
                  <input type="datetime-local" className="input text-sm flex-1" value={task.due_date} onChange={e => setTask(p => ({ ...p, due_date: e.target.value }))} />
                  <select className="input text-sm flex-1" value={task.assigned_to} onChange={e => setTask(p => ({ ...p, assigned_to: e.target.value }))}>
                    <option value="">Assign to...</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={createTask} className="btn-primary text-xs"><Check size={12} /> Save</button>
                  <button onClick={() => setShowTaskForm(false)} className="btn-ghost text-xs"><X size={12} /> Cancel</button>
                </div>
              </div>
            )}
            <div className="divide-y divide-border/40">
              {(lead.tasks || []).map(t => (
                <div key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                  <button
                    onClick={() => completeTask(t.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${t.status === 'completed' ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                  >
                    {t.status === 'completed' && <Check size={11} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.due_date && <span className="text-xs text-text-secondary">{format(new Date(t.due_date), 'MMM d, h:mm a')}</span>}
                      {t.team_members && <span className="text-xs text-text-secondary">{t.team_members.name}</span>}
                    </div>
                  </div>
                  <span className={`badge ${t.status === 'completed' ? 'badge-success' : t.status === 'in_progress' ? 'badge-new' : 'badge-neutral'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
              {!(lead.tasks?.length) && <div className="px-5 py-6 text-center text-sm text-text-secondary">No tasks yet</div>}
            </div>
          </div>

          {/* Call History */}
          <div className="card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="section-title">Call History</h2>
            </div>
            <div className="divide-y divide-border/40">
              {(lead.calls || []).map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'completed' ? 'bg-success' : c.status === 'failed' ? 'bg-danger' : 'bg-warning'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-text-primary capitalize">{c.status}</p>
                    <p className="text-xs text-text-secondary">{format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  {c.duration && <span className="text-xs text-text-secondary">{Math.floor(c.duration / 60)}m {c.duration % 60}s</span>}
                </div>
              ))}
              {!(lead.calls?.length) && <div className="px-5 py-6 text-center text-sm text-text-secondary">No calls yet</div>}
            </div>
          </div>

          {/* Email History */}
          <div className="card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="section-title">Email History</h2>
            </div>
            <div className="divide-y divide-border/40">
              {(lead.emails || []).map(e => (
                <div key={e.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-text-primary">{e.subject}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{format(new Date(e.sent_at), 'MMM d, yyyy h:mm a')}</p>
                  <p className="text-xs text-text-secondary mt-2 line-clamp-2">{e.body}</p>
                </div>
              ))}
              {!(lead.emails?.length) && <div className="px-5 py-6 text-center text-sm text-text-secondary">No emails yet</div>}
            </div>
          </div>

          {/* Meetings */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="section-title flex items-center gap-2">
                <Calendar size={14} className="text-primary" /> Meetings
              </h2>
              <button onClick={() => setShowMeetingForm(!showMeetingForm)} className="btn-ghost text-xs py-1">
                <Plus size={13} /> Book Meeting
              </button>
            </div>

            {showMeetingForm && (
              <div className="px-5 py-4 bg-app border-b border-border space-y-3">
                <div>
                  <label className="label">Select Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.slice(0, 6).map(day => (
                      <button key={day.date} type="button"
                        onClick={() => { setMeetingDate(day.date); setMeetingTime('') }}
                        className={`p-2 rounded-lg border text-xs text-left transition-all ${meetingDate === day.date ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-white'}`}
                      >
                        <p className="font-semibold text-text-primary">{day.day_name.slice(0,3)}</p>
                        <p className="text-text-secondary">{day.display.split(' ').slice(0,2).join(' ')}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {meetingDate && (
                  <div>
                    <label className="label">Select Time</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {slots.find(s => s.date === meetingDate)?.slots.map(time => (
                        <button key={time} type="button"
                          onClick={() => setMeetingTime(time)}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${meetingTime === time ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary/50 text-text-primary bg-white'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={bookMeeting} disabled={!meetingDate || !meetingTime} className="btn-primary text-xs disabled:opacity-40">
                    <Check size={12} /> Confirm
                  </button>
                  <button onClick={() => setShowMeetingForm(false)} className="btn-ghost text-xs"><X size={12} /> Cancel</button>
                </div>
              </div>
            )}

            <div className="divide-y divide-border/40">
              {meetings.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'scheduled' ? 'bg-primary' : m.status === 'completed' ? 'bg-success' : 'bg-border'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{m.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{m.meeting_date} · {m.meeting_time} · {m.duration_minutes} min</p>
                  </div>
                  <span className={`badge ${m.status === 'scheduled' ? 'badge-new' : m.status === 'completed' ? 'badge-success' : 'badge-neutral'}`}>
                    {m.status}
                  </span>
                  {m.status === 'scheduled' && (
                    <button onClick={() => cancelMeeting(m.id)} className="text-danger/60 hover:text-danger p-1 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              {!meetings.length && <div className="px-5 py-6 text-center text-sm text-text-secondary">No meetings scheduled</div>}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Activity Timeline</h2>
            <ActivityTimeline activities={lead.activities || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
