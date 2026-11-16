import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, Phone, Mail, MessageSquare, ChevronRight,
  Plus, Check, X, AlertCircle, RefreshCw, Flame,
  Calendar, PhoneCall, Send, Loader, CheckCircle
} from 'lucide-react'
import { leadsApi, callsApi, emailsApi } from '../lib/api'

const FOLLOW_UP_TYPES = [
  { key: 'call',  label: 'Phone Call', icon: Phone,         color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'email', label: 'Email',      icon: Mail,          color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'sms',   label: 'SMS',        icon: MessageSquare, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
]

const PRIORITY = {
  hot:  { label: 'Hot',  color: '#DC2626', bg: '#FFF5F5', border: '#FECACA' },
  warm: { label: 'Warm', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  cold: { label: 'Cold', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
}

/* ── VAPI Call Modal ── */
function VapiCallModal({ lead, onClose }) {
  const [status, setStatus] = useState('idle') // idle | calling | connected | ended | error
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (status !== 'connected') return
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startCall = async () => {
    if (!lead?.phone) return
    setStatus('calling')
    try {
      await callsApi.initiate(lead.id)
      setStatus('connected')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-80 overflow-hidden animate-scale-in">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#2563EB,#0891B2)' }} />
        <div className="p-6 flex flex-col items-center gap-4">

          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {lead.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            {status === 'calling' && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-60" />
            )}
            {status === 'connected' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-900 text-base">{lead.name}</p>
            <p className="text-sm text-slate-500">{lead.phone || 'No phone number'}</p>
          </div>

          {/* Status pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            status === 'idle'      ? 'bg-slate-100 text-slate-600' :
            status === 'calling'   ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            status === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            status === 'error'     ? 'bg-red-50 text-red-600 border border-red-200' :
                                     'bg-slate-100 text-slate-500'
          }`}>
            {status === 'idle'      && <><Phone size={12} /> Ready — VAPI Agent</>}
            {status === 'calling'   && <><Loader size={12} className="animate-spin" /> Connecting via VAPI…</>}
            {status === 'connected' && <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {fmt(seconds)}</>}
            {status === 'ended'     && <><Clock size={12} /> Call ended · {fmt(seconds)}</>}
            {status === 'error'     && <><AlertCircle size={12} /> Connection failed</>}
          </div>

          {/* Note */}
          {status === 'idle' && (
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              VAPI AI agent will call <strong>{lead.phone || 'this number'}</strong> immediately on your behalf.
            </p>
          )}
          {status === 'connected' && (
            <p className="text-xs text-emerald-600 text-center">VAPI agent is live on the call</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            {status === 'idle' && (
              <>
                <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={startCall} disabled={!lead.phone}
                  className="btn-primary flex-1 justify-center gap-2 disabled:opacity-40">
                  <PhoneCall size={15} /> Call Now
                </button>
              </>
            )}
            {(status === 'calling' || status === 'connected') && (
              <button onClick={() => setStatus('ended')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                <Phone size={15} /> End Call
              </button>
            )}
            {(status === 'ended' || status === 'error') && (
              <button onClick={onClose} className="btn-secondary w-full justify-center">Close</button>
            )}
          </div>

          {!lead.phone && status === 'idle' && (
            <p className="text-xs text-red-500 -mt-2">Add a phone number to this lead first</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Email Modal ── */
function EmailModal({ lead, onClose }) {
  const [subject, setSubject] = useState(`Follow-up — ${lead.name}`)
  const [body, setBody] = useState(
`Hi ${lead.name?.split(' ')[0]},

I wanted to follow up and check if you had any questions about Brown Capital's private wealth management services.

I'd love to connect at your earliest convenience.

Best regards,
Jarrod Brown
Brown Capital`
  )
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const send = async () => {
    if (!lead.email) return
    setSending(true)
    try {
      await emailsApi.send({ lead_id: lead.id, subject, body })
      setSent(true)
      setTimeout(onClose, 1800)
    } catch {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7C3AED,#2563EB)' }} />

        {sent ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-slate-900 text-base">Email Sent!</p>
            <p className="text-sm text-slate-500">Follow-up sent to {lead.email}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Follow-up Email</p>
                <h3 className="font-bold text-slate-900">To: {lead.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{lead.email || 'No email on file'}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="label">Subject</label>
                <input className="input text-sm" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input text-sm resize-none" rows={8} value={body} onChange={e => setBody(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={send} disabled={sending || !lead.email}
                className="btn-primary flex-1 justify-center gap-2 disabled:opacity-40">
                {sending ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </div>

            {!lead.email && (
              <p className="text-xs text-red-500 text-center pb-4 -mt-2">No email address on file for this lead</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Date Picker Modal ── */
function ScheduleModal({ item, onClose, onSave }) {
  const [date, setDate] = useState(item.due ? item.due.split('T')[0] : new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(item.due ? new Date(item.due).toTimeString().slice(0,5) : '10:00')
  const [note, setNote] = useState(item.note || '')

  const save = () => {
    onSave({ ...item, due: `${date}T${time}:00`, note })
    onClose()
  }

  const type = FOLLOW_UP_TYPES.find(t => t.key === item.type) || FOLLOW_UP_TYPES[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: type.color }}>
              Schedule {type.label}
            </p>
            <h3 className="font-bold text-slate-900">{item.lead?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none h-20" value={note} onChange={e => setNote(e.target.value)}
              placeholder="What to cover in this follow-up…" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={save} className="btn-primary flex-1 justify-center gap-2">
            <Calendar size={15} /> Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Follow-up Card ── */
function FollowUpCard({ item, onDone, onSnooze, onReschedule, onCall, onEmail }) {
  const [expanded, setExpanded] = useState(false)
  const p = PRIORITY[item.lead?.score || 'cold']
  const type = FOLLOW_UP_TYPES.find(t => t.key === item.type) || FOLLOW_UP_TYPES[0]
  const Icon = type.icon
  const overdue = item.due && new Date(item.due) < new Date()

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${overdue ? 'border-red-200' : ''}`}>
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {/* Type icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: type.bg, border: `1px solid ${type.border}` }}>
          <Icon size={15} style={{ color: type.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{item.lead?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500 truncate">{item.lead?.company || item.lead?.email || ''}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                {p.label}
              </span>
              {overdue && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertCircle size={10} /> Overdue
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[11px] font-semibold" style={{ color: type.color }}>{type.label}</span>
            {item.due && (
              <button
                onClick={e => { e.stopPropagation(); onReschedule(item) }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-lg transition-all"
                title="Change date"
              >
                <Calendar size={10} />
                {new Date(item.due).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                {' '}
                {new Date(item.due).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </button>
            )}
            {!item.due && (
              <button
                onClick={e => { e.stopPropagation(); onReschedule(item) }}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-lg transition-all border border-blue-200"
              >
                <Calendar size={10} /> Set date
              </button>
            )}
            <span className="capitalize text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{item.lead?.stage || 'new'}</span>
          </div>

          {item.note && !expanded && (
            <p className="text-xs text-slate-500 mt-1.5 truncate">{item.note}</p>
          )}
        </div>

        <ChevronRight size={14} className={`text-slate-300 flex-shrink-0 transition-transform mt-1 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60 animate-slide-up">
          {item.note && <p className="text-xs text-slate-600 mb-3 leading-relaxed">{item.note}</p>}

          <div className="flex items-center gap-2 flex-wrap">
            {/* Call — fires VAPI immediately */}
            <button onClick={() => onCall(item.lead)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
              <PhoneCall size={12} /> Call Now (VAPI)
            </button>

            {/* Email — opens compose modal */}
            <button onClick={() => onEmail(item.lead)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm">
              <Mail size={12} /> Send Email
            </button>

            <button onClick={() => onDone(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <Check size={12} /> Done
            </button>

            <button onClick={() => onSnooze(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
              <Clock size={12} /> Snooze 1 day
            </button>

            <button onClick={() => onReschedule(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
              <Calendar size={12} /> Reschedule
            </button>

            <Link to={`/leads/${item.lead?.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors ml-auto">
              View Lead <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Add Follow-up Modal ── */
function AddFollowUpModal({ leads, onClose, onAdd }) {
  const [form, setForm] = useState({ lead_id: '', type: 'call', due: '', time: '10:00', note: '' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = e => {
    e.preventDefault()
    if (!form.lead_id) return
    const lead = leads.find(l => l.id === form.lead_id)
    const due = form.due ? `${form.due}T${form.time}:00` : ''
    onAdd({ ...form, id: Date.now().toString(), lead, due, done: false })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Schedule Follow-up</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="label">Lead *</label>
            <select className="input" value={form.lead_id} onChange={set('lead_id')} required>
              <option value="">Select a lead…</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {FOLLOW_UP_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setForm(p => ({ ...p, type: t.key }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.type === t.key ? 'text-white' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={form.type === t.key ? { background: t.color, borderColor: t.color } : {}}>
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.due} onChange={set('due')} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={form.time} onChange={set('time')} />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none h-20" value={form.note} onChange={set('note')}
              placeholder="What to discuss or action…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Schedule</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function FollowUp() {
  const [leads, setLeads]       = useState([])
  const [items, setItems]       = useState([])
  const [filter, setFilter]     = useState('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [callLead, setCallLead] = useState(null)
  const [emailLead, setEmailLead] = useState(null)
  const [scheduleItem, setScheduleItem] = useState(null)

  useEffect(() => {
    leadsApi.getAll().then(ls => {
      setLeads(ls)
      const auto = ls
        .filter(l => ['new', 'contacted', 'qualified'].includes(l.stage))
        .map((l, i) => {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + (l.score === 'hot' ? 0 : l.score === 'warm' ? 1 : 3) + (i % 3))
          dueDate.setHours(10, 0, 0, 0)
          return {
            id: `auto-${l.id}`,
            lead: l,
            type: l.stage === 'new' ? 'call' : l.stage === 'contacted' ? 'email' : 'call',
            due: dueDate.toISOString(),
            note: l.stage === 'new' ? 'Initial outreach call' : l.stage === 'contacted' ? 'Follow-up email after first contact' : 'Qualification call',
            done: false,
          }
        })
      setItems(auto)
    })
  }, [])

  const markDone  = id => setItems(prev => prev.filter(i => i.id !== id))
  const snooze    = id => setItems(prev => prev.map(i => {
    if (i.id !== id) return i
    const d = new Date(i.due || new Date())
    d.setDate(d.getDate() + 1)
    return { ...i, due: d.toISOString() }
  }))
  const reschedule = updated => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))

  const now      = new Date()
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const filtered = items.filter(i => {
    if (filter === 'overdue')  return i.due && new Date(i.due) < now
    if (filter === 'today')    { const d = new Date(i.due); return d >= now && d <= todayEnd }
    if (filter === 'upcoming') return i.due && new Date(i.due) > todayEnd
    return true
  })

  const overdueCount  = items.filter(i => i.due && new Date(i.due) < now).length
  const todayCount    = items.filter(i => { const d = new Date(i.due); return d >= now && d <= todayEnd }).length
  const hotLeads      = items.filter(i => i.lead?.score === 'hot').length

  const KPI_STATS = [
    { label: 'Total Pending', value: items.length,  Icon: RefreshCw,   color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Overdue',       value: overdueCount,  Icon: AlertCircle, color: '#DC2626', bg: '#FFF5F5' },
    { label: 'Due Today',     value: todayCount,    Icon: Clock,       color: '#D97706', bg: '#FFFBEB' },
    { label: 'Hot Leads',     value: hotLeads,      Icon: Flame,       color: '#EA580C', bg: '#FFF7ED' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">{items.length} pending · {overdueCount} overdue</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} /> Schedule Follow-up
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPI_STATS.map(stat => (
          <div key={stat.label} className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.bg }}>
              <stat.Icon size={16} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all',      label: 'All',      count: items.length },
          { key: 'overdue',  label: 'Overdue',  count: overdueCount },
          { key: 'today',    label: 'Today',    count: todayCount },
          { key: 'upcoming', label: 'Upcoming', count: items.filter(i => i.due && new Date(i.due) > todayEnd).length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.key ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab.label}
            <span className={`ml-1.5 text-[10px] font-bold ${filter === tab.key ? 'text-blue-600' : 'text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Instructions hint */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 mb-4 text-xs text-blue-700">
        <PhoneCall size={13} className="text-blue-500 flex-shrink-0" />
        <span><strong>Call Now</strong> connects via VAPI AI agent · <strong>Send Email</strong> fires a follow-up email · click the <strong>date</strong> to reschedule</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Check size={28} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">All caught up!</p>
          <p className="text-xs text-slate-400 mt-1">No follow-ups in this category.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered
            .sort((a, b) => new Date(a.due || 0) - new Date(b.due || 0))
            .map(item => (
              <FollowUpCard
                key={item.id}
                item={item}
                onDone={markDone}
                onSnooze={snooze}
                onReschedule={setScheduleItem}
                onCall={setCallLead}
                onEmail={setEmailLead}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {showAdd     && <AddFollowUpModal leads={leads} onClose={() => setShowAdd(false)} onAdd={item => setItems(p => [item, ...p])} />}
      {callLead    && <VapiCallModal    lead={callLead}    onClose={() => setCallLead(null)} />}
      {emailLead   && <EmailModal       lead={emailLead}   onClose={() => setEmailLead(null)} />}
      {scheduleItem && <ScheduleModal   item={scheduleItem} onClose={() => setScheduleItem(null)} onSave={reschedule} />}
    </div>
  )
}
