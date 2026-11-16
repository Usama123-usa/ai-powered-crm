import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ArrowRight, Mail, Phone, X, Check, Calendar, CheckCircle } from 'lucide-react'
import { leadsApi } from '../lib/api'
import ScoreBadge from '../components/ScoreBadge'
import Avatar from '../components/Avatar'

const STAGES = [
  { key: 'new',       label: 'New',           color: '#64748B', light: '#F8FAFC', border: '#E2E8F0' },
  { key: 'contacted', label: 'Contacted',      color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE' },
  { key: 'qualified', label: 'Qualified',      color: '#059669', light: '#F0FDF4', border: '#BBF7D0' },
  { key: 'emailed',   label: 'Appt. Booked',   color: '#0891B2', light: '#F0FDFA', border: '#99F6E4' },
  { key: 'closed',    label: 'Converted',      color: '#16A34A', light: '#F0FDF4', border: '#86EFAC' },
  { key: 'lost',      label: 'Lost',           color: '#DC2626', light: '#FFF5F5', border: '#FECACA' },
]

function LeadCard({ lead, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead)}
      className="bg-white border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing shadow-card
                 hover:shadow-card-hover hover:border-gray-200 transition-all duration-150 group"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <Avatar name={lead.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate leading-tight">{lead.name}</p>
          {lead.company && <p className="text-[11px] text-text-secondary truncate">{lead.company}</p>}
        </div>
        <ScoreBadge score={lead.score} stage={lead.stage} />
      </div>

      {/* Contact info */}
      {lead.email && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mail size={10} className="text-text-muted flex-shrink-0" />
          <p className="text-[10px] text-text-secondary truncate">{lead.email}</p>
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-1.5 mb-2">
          <Phone size={10} className="text-text-muted flex-shrink-0" />
          <p className="text-[10px] text-text-secondary truncate">{lead.phone}</p>
        </div>
      )}

      {/* Source */}
      {lead.source && (
        <div className="flex items-center gap-1 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium capitalize">{lead.source}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
        <Link
          to={`/leads/${lead.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View <ArrowRight size={10} />
        </Link>
        <span className="text-[10px] text-text-muted">
          {new Date(lead.created_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

function StageColumn({ stage, leads, dragging, dragOver, onDragStart, onDrop, onDragOver, onDragLeave }) {
  const isDragTarget = dragOver === stage.key

  return (
    <div className="flex flex-col min-w-[220px] flex-shrink-0 xl:flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <span className="text-xs font-semibold text-text-primary flex-1 truncate">{stage.label}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ background: `${stage.color}18`, color: stage.color }}
        >
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 rounded-xl min-h-[480px] p-2 space-y-2 transition-all duration-150"
        style={{
          background: isDragTarget ? `${stage.color}08` : stage.light,
          border: `1px solid ${isDragTarget ? stage.color + '40' : stage.border}`,
        }}
        onDrop={e => onDrop(e, stage.key)}
        onDragOver={e => { e.preventDefault(); onDragOver(stage.key) }}
        onDragLeave={onDragLeave}
      >
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 mt-4">
            <p className="text-[11px] text-text-muted text-center px-2">Drop leads here</p>
          </div>
        )}
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [moveToast, setMoveToast] = useState(null)
  const [bookingLead, setBookingLead] = useState(null)

  useEffect(() => {
    leadsApi.getAll().then(l => { setLeads(l); setLoading(false) })
  }, [])

  const filtered = search
    ? leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()))
    : leads

  const byStage = (stage) => filtered.filter(l => l.stage === stage)

  const onDragStart = (e, lead) => {
    setDragging(lead)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDrop = async (e, stage) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.stage === stage) return
    const prevStage = dragging.stage
    setLeads(prev => prev.map(l => l.id === dragging.id ? { ...l, stage } : l))
    await leadsApi.update(dragging.id, { stage })
    setDragging(null)
    // show toast notification
    setMoveToast({ name: dragging.name, from: prevStage, to: stage })
    setTimeout(() => setMoveToast(null), 3500)
    // if moved to emailed (Appt. Booked) show booking panel
    if (stage === 'emailed') setBookingLead({ ...dragging, stage })
  }

  const total = leads.length
  const converted = leads.filter(l => l.stage === 'closed').length
  const convRate = total ? Math.round((converted / total) * 100) : 0

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="page-title">Lead Pipeline</h1>
          <p className="page-subtitle">{total} leads · {convRate}% conversion rate</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="pl-8 pr-3 py-2 text-xs bg-white border border-border rounded-xl text-text-primary
                         placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-48"
            />
          </div>
          <Link to="/leads" className="btn-primary text-xs py-2">
            <Plus size={13} /> Add Lead
          </Link>
        </div>
      </div>

      {/* Stage summary pills */}
      <div className="flex items-center gap-2 mb-5 flex-shrink-0 overflow-x-auto pb-1">
        {STAGES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium flex-shrink-0"
            style={{ background: `${s.color}10`, color: s.color, border: `1px solid ${s.color}25` }}>
            <span className="font-bold">{byStage(s.key).length}</span>
            {s.label}
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full pb-4" style={{ minWidth: 1320 }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            STAGES.map(stage => (
              <StageColumn
                key={stage.key}
                stage={stage}
                leads={byStage(stage.key)}
                dragging={dragging}
                dragOver={dragOver}
                onDragStart={onDragStart}
                onDrop={onDrop}
                onDragOver={setDragOver}
                onDragLeave={() => setDragOver(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Stage-move toast */}
      {moveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-modal text-sm font-medium">
            <CheckCircle size={16} className="text-emerald-400" />
            <span><strong>{moveToast.name}</strong> moved to <strong className="capitalize">{STAGES.find(s => s.key === moveToast.to)?.label}</strong></span>
          </div>
        </div>
      )}

      {/* Appointment booking panel */}
      {bookingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Appointment Booking</p>
                <h3 className="font-bold text-slate-900">Book with {bookingLead.name}</h3>
              </div>
              <button onClick={() => setBookingLead(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                <CheckCircle size={16} className="text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">Lead moved to <strong>Appt. Booked</strong> stage</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">Time</label>
                  <select className="input">
                    {['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Meeting Title</label>
                <input type="text" className="input" defaultValue={`Initial Consultation — ${bookingLead.name}`} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none h-20" placeholder="Any notes for this appointment…" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setBookingLead(null)} className="btn-secondary flex-1">Skip for now</button>
              <button onClick={() => setBookingLead(null)} className="btn-primary flex-1 gap-2">
                <Calendar size={15} /> Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
