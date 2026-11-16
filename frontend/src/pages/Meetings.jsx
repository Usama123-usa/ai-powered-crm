import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Plus, X,
  Check, User
} from 'lucide-react'
import { meetingsApi, leadsApi } from '../lib/api'

const STATUS = {
  scheduled: { label: 'Scheduled',  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'border-blue-200' },
  confirmed: { label: 'Confirmed',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-200' },
  completed: { label: 'Completed',  bg: 'bg-green-50',   text: 'text-success',     dot: 'bg-green-500',   ring: 'border-green-200' },
  no_show:   { label: 'No Show',    bg: 'bg-red-50',     text: 'text-danger',      dot: 'bg-red-400',     ring: 'border-red-200' },
  cancelled: { label: 'Cancelled',  bg: 'bg-gray-100',   text: 'text-gray-500',    dot: 'bg-gray-400',    ring: 'border-gray-200' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function MeetingCard({ meeting, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false)
  const dateObj = new Date(meeting.meeting_date + 'T12:00:00')

  return (
    <div
      className="card hover:shadow-card-hover transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Date block */}
        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.12)' }}>
          <span className="text-[9px] font-bold text-primary uppercase leading-none">
            {dateObj.toLocaleDateString('en', { month: 'short' })}
          </span>
          <span className="text-lg font-display font-bold text-primary leading-none mt-0.5">
            {dateObj.getDate()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary leading-tight truncate">{meeting.title}</p>
            <StatusBadge status={meeting.status} />
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock size={11} />
              {meeting.meeting_time}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar size={11} />
              {meeting.duration_minutes}min
            </div>
            {meeting.leads?.name && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <User size={11} />
                {meeting.leads.name}
              </div>
            )}
          </div>
          {meeting.notes && !expanded && (
            <p className="text-xs text-text-secondary mt-1.5 truncate">{meeting.notes}</p>
          )}
        </div>

        <ChevronRight size={14} className={`text-text-muted flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/60 px-4 py-3 bg-gray-50/60 animate-slide-up">
          {meeting.notes && (
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">{meeting.notes}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Update status:</span>
            {Object.entries(STATUS).map(([key, val]) => (
              meeting.status !== key && (
                <button
                  key={key}
                  onClick={e => { e.stopPropagation(); onUpdateStatus(meeting.id, key) }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 ${val.bg} ${val.text} ${val.ring}`}
                >
                  {val.label}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Meetings() {
  const [meetings, setMeetings]   = useState([])
  const [leads, setLeads]         = useState([])
  const [filter, setFilter]       = useState('scheduled')
  const [loading, setLoading]     = useState(true)
  const [showBook, setShowBook]   = useState(false)
  const [view, setView]           = useState('list') // list | calendar
  const [weekOffset, setWeekOffset] = useState(0)

  // Booking form state
  const [bLead, setBLead]   = useState('')
  const [bDate, setBDate]   = useState('')
  const [bTime, setBTime]   = useState('')
  const [bTitle, setBTitle] = useState('Discovery Call with Jarrod Brown')
  const [bDur, setBDur]     = useState(20)
  const [bNotes, setBNotes] = useState('')
  const [booking, setBooking] = useState(false)

  const TIME_SLOTS = [
    '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM',
    '03:00 PM','03:30 PM','04:00 PM','04:30 PM',
  ]

  const load = useCallback(() => {
    Promise.all([meetingsApi.getAll(), leadsApi.getAll()])
      .then(([m, l]) => { setMeetings(m); setLeads(l); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await meetingsApi.update(id, { status })
    load()
  }

  const bookAppointment = async (e) => {
    e.preventDefault()
    if (!bLead || !bDate || !bTime) return
    setBooking(true)
    try {
      await meetingsApi.create({
        lead_id: bLead,
        meeting_date: bDate,
        meeting_time: bTime,
        title: bTitle,
        duration_minutes: Number(bDur),
        notes: bNotes,
        status: 'scheduled',
      })
      setShowBook(false)
      load()
    } catch {}
    setBooking(false)
  }

  const FILTERS = ['all','scheduled','confirmed','completed','cancelled','no_show']
  const FILTER_LABELS = { all: 'All', scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show' }

  const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter)
  const grouped = filtered.reduce((acc, m) => {
    acc[m.meeting_date] = acc[m.meeting_date] || []
    acc[m.meeting_date].push(m)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort()

  const scheduledCount = meetings.filter(m => m.status === 'scheduled').length
  const completedCount = meetings.filter(m => m.status === 'completed').length
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{scheduledCount} upcoming · {completedCount} completed</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view==='list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              List
            </button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view==='calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Calendar
            </button>
          </div>
          <button onClick={() => setShowBook(true)} className="btn-primary text-xs py-2">
            <Plus size={13} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: meetings.length, color: '#64748B' },
          { label: 'Scheduled', value: scheduledCount, color: '#2563EB' },
          { label: 'Confirmed', value: meetings.filter(m => m.status === 'confirmed').length, color: '#059669' },
          { label: 'Completed', value: completedCount, color: '#16A34A' },
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <div className="text-xl font-display font-bold text-text-primary tabular-nums">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-0.5">{stat.label}</div>
            <div className="mt-2 progress-track">
              <div className="progress-fill" style={{ width: meetings.length ? `${(stat.value / meetings.length) * 100}%` : '0%', background: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
              ${filter === f ? 'bg-white text-text-primary shadow-card' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {FILTER_LABELS[f]}
            <span className={`ml-1.5 text-[10px] font-bold ${filter === f ? 'text-primary' : 'text-text-muted'}`}>
              {f === 'all' ? meetings.length : meetings.filter(m => m.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Calendar View ── */}
      {view === 'calendar' && (() => {
        const today = new Date()
        // Get start of this week's Monday
        const monday = new Date(today)
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
        monday.setHours(0,0,0,0)
        const days = Array.from({ length: 5 }, (_, i) => {
          const d = new Date(monday)
          d.setDate(monday.getDate() + i)
          return d
        })
        const hours = Array.from({ length: 9 }, (_, i) => i + 9) // 9..17
        const getMeetingsForSlot = (day, hour) => {
          const dateStr = day.toISOString().split('T')[0]
          return meetings.filter(m => {
            if (m.meeting_date !== dateStr) return false
            const timeStr = m.meeting_time || ''
            const h = parseInt(timeStr)
            const isPM = timeStr.toLowerCase().includes('pm') && h !== 12
            const h24 = isPM ? h + 12 : (timeStr.toLowerCase().includes('am') && h === 12 ? 0 : h)
            return h24 === hour
          })
        }
        const isToday = (d) => d.toDateString() === today.toDateString()
        const weekStart = days[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })
        const weekEnd = days[4].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
        return (
          <div className="card overflow-hidden">
            {/* Week nav */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <button onClick={() => setWeekOffset(w => w - 1)} className="btn-icon"><ChevronLeft size={16} /></button>
              <p className="text-sm font-semibold text-slate-700">{weekStart} — {weekEnd}</p>
              <div className="flex gap-1">
                {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-600 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">Today</button>}
                <button onClick={() => setWeekOffset(w => w + 1)} className="btn-icon"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div style={{ minWidth: 700 }}>
                {/* Day headers */}
                <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
                  <div className="border-r border-slate-100" />
                  {days.map((d, i) => (
                    <div key={i} className={`px-3 py-2.5 text-center border-r border-slate-100 last:border-r-0 ${isToday(d) ? 'bg-blue-50' : ''}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {d.toLocaleDateString('en', { weekday: 'short' })}
                      </p>
                      <p className={`text-base font-bold mt-0.5 ${isToday(d) ? 'text-blue-600' : 'text-slate-800'}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time grid */}
                {hours.map(hour => (
                  <div key={hour} className="grid border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors" style={{ gridTemplateColumns: '56px repeat(5, 1fr)', minHeight: 52 }}>
                    {/* Time label */}
                    <div className="border-r border-slate-100 flex items-start justify-end pr-2 pt-1.5">
                      <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                      </span>
                    </div>
                    {/* Day cells */}
                    {days.map((d, di) => {
                      const slotMeetings = getMeetingsForSlot(d, hour)
                      return (
                        <div key={di} className={`border-r border-slate-50 last:border-r-0 p-1 ${isToday(d) ? 'bg-blue-50/40' : ''}`}>
                          {slotMeetings.map(m => (
                            <div key={m.id} className="rounded-lg px-2 py-1 mb-0.5 text-[10px] font-semibold truncate cursor-pointer"
                              style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid rgba(37,99,235,0.2)' }}>
                              {m.title}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Meeting list grouped by date */}
      {view === 'list' && (loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={28} className="mx-auto text-border mb-3" />
          <p className="text-sm font-semibold text-text-primary">No appointments found</p>
          <p className="text-xs text-text-secondary mt-1 mb-4">Book one to get started</p>
          <button onClick={() => setShowBook(true)} className="btn-primary text-xs mx-auto">
            <Plus size={13} /> Book Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const d = new Date(date + 'T12:00:00')
            const isToday = date === todayStr
            const isFuture = date > todayStr
            return (
              <div key={date}>
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <span className={`text-xs font-bold tracking-wide uppercase ${isToday ? 'text-primary' : 'text-text-secondary'}`}>
                      {isToday ? 'Today · ' : ''}
                      {d.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-1 gold-line" />
                  <span className="text-[10px] text-text-muted">{grouped[date].length} appt</span>
                </div>

                <div className="space-y-2">
                  {grouped[date].map(m => (
                    <MeetingCard key={m.id} meeting={m} onUpdateStatus={updateStatus} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* ── Book Modal ── */}
      {showBook && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-display font-bold text-text-primary">Book Appointment</h3>
                <p className="text-xs text-text-secondary mt-0.5">Schedule a client meeting</p>
              </div>
              <button onClick={() => setShowBook(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={bookAppointment} className="space-y-4">
              <div>
                <label className="label">Lead / Client *</label>
                <select className="input text-sm" value={bLead} onChange={e => setBLead(e.target.value)} required>
                  <option value="">Select a lead…</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Title</label>
                <input className="input text-sm" value={bTitle} onChange={e => setBTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input text-sm" value={bDate} onChange={e => setBDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <select className="input text-sm" value={bDur} onChange={e => setBDur(e.target.value)}>
                    {[15,20,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Time Slot *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOTS.map(t => (
                    <button key={t} type="button"
                      onClick={() => setBTime(t)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${bTime === t
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-50 text-text-secondary border border-border hover:border-primary/40 hover:text-primary'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input text-sm resize-none" rows={2} value={bNotes} onChange={e => setBNotes(e.target.value)} placeholder="Optional meeting notes…" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={booking} className="flex-1 btn-primary justify-center disabled:opacity-50">
                  <Check size={14} /> {booking ? 'Booking…' : 'Confirm Booking'}
                </button>
                <button type="button" onClick={() => setShowBook(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
