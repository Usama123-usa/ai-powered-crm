import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, MoreHorizontal,
  Phone, Mail, ArrowRight, Trash2, ChevronDown, Users,
  PhoneCall, PhoneOutgoing, X, Mic, MicOff, Clock
} from 'lucide-react'
import { leadsApi, tasksApi } from '../lib/api'
import Avatar from '../components/Avatar'
import ScoreBadge from '../components/ScoreBadge'
import StageBadge from '../components/StageBadge'
import { formatDistanceToNow } from 'date-fns'

const STAGES = ['all', 'new', 'contacted', 'qualified', 'emailed', 'closed', 'lost']
const SCORES = ['all', 'hot', 'warm', 'cold']
const SOURCES = ['all', 'website', 'referral', 'linkedin', 'email', 'cold-call', 'event', 'other']

function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'website', score: 'cold', stage: 'new' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const lead = await leadsApi.create(form)
      // Auto-create follow-up task
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (form.score === 'hot' ? 1 : form.score === 'warm' ? 2 : 5))
      try {
        await tasksApi.create({
          lead_id: lead.id,
          title: `Initial outreach — ${lead.name}`,
          due_date: dueDate.toISOString().split('T')[0],
          priority: form.score === 'hot' ? 'high' : form.score === 'warm' ? 'medium' : 'low',
          status: 'pending',
        })
      } catch {}
      onCreated(lead)
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-display font-bold text-text-primary">Add New Lead</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="John Smith" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" placeholder="Company Inc." value={form.company} onChange={set('company')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={set('source')}>
                {['website','referral','linkedin','email','cold-call','event','other'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Score</label>
              <select className="input" value={form.score} onChange={set('score')}>
                {['hot','warm','cold'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="input" value={form.stage} onChange={set('stage')}>
                {['new','contacted','qualified','emailed','closed','lost'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Outbound Call Modal ── */
function OutboundCallModal({ lead, onClose }) {
  const [status, setStatus] = useState('idle') // idle | calling | connected | ended
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (status !== 'connected') return
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startCall = () => {
    setStatus('calling')
    setTimeout(() => setStatus('connected'), 2200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-80 animate-scale-in overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #2563EB, #0891B2)' }} />
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-primary">
            {lead.name.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 text-base">{lead.name}</p>
            <p className="text-sm text-slate-500">{lead.phone || 'No phone'}</p>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            status === 'idle' ? 'bg-slate-100 text-slate-600' :
            status === 'calling' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            status === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-slate-100 text-slate-500'
          }`}>
            {status === 'idle' && <><PhoneOutgoing size={12} /> Ready to call</>}
            {status === 'calling' && <><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Calling…</>}
            {status === 'connected' && <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {fmt(seconds)}</>}
            {status === 'ended' && <><Clock size={12} /> Call ended · {fmt(seconds)}</>}
          </div>

          {/* Controls */}
          {status === 'connected' && (
            <button
              onClick={() => setMuted(m => !m)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {muted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            {status === 'idle' && (
              <>
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button onClick={startCall} disabled={!lead.phone} className="btn-primary flex-1 gap-2">
                  <PhoneCall size={15} /> Call
                </button>
              </>
            )}
            {status === 'calling' && (
              <button onClick={() => { setStatus('ended') }} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                <X size={15} /> Cancel Call
              </button>
            )}
            {status === 'connected' && (
              <button onClick={() => { setStatus('ended') }} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                <Phone size={15} /> End Call
              </button>
            )}
            {status === 'ended' && (
              <button onClick={onClose} className="btn-secondary w-full">Close</button>
            )}
          </div>
          {!lead.phone && status === 'idle' && (
            <p className="text-xs text-red-500 -mt-2">No phone number on file</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [callLead, setCallLead] = useState(null)

  const load = () => leadsApi.getAll().then(l => { setLeads(l); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.email?.toLowerCase().includes(search.toLowerCase()) && !l.company?.toLowerCase().includes(search.toLowerCase())) return false
    if (stageFilter !== 'all' && l.stage !== stageFilter) return false
    if (scoreFilter !== 'all' && l.score !== scoreFilter) return false
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    await leadsApi.delete(id)
    setLeads(l => l.filter(x => x.id !== id))
    setOpenMenu(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{leads.length} total leads · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCallLead({ name: 'Manual Outbound', phone: '' })}
            className="btn-secondary gap-2 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
          >
            <PhoneOutgoing size={15} className="text-blue-600" /> Outbound Call
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="input pl-9"
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer text-sm w-36"
            >
              {STAGES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          {/* Score filter */}
          <div className="relative">
            <select
              value={scoreFilter}
              onChange={e => setScoreFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer text-sm w-36"
            >
              {SCORES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Scores' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          {/* Source filter */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer text-sm w-36"
            >
              {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} className="text-border mb-3" />
            <p className="text-sm font-semibold text-text-primary">No leads found</p>
            <p className="text-xs text-text-secondary mt-1">Try adjusting your filters or add a new lead.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 table-header">Lead</th>
                <th className="text-left px-4 py-3.5 table-header hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3.5 table-header hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3.5 table-header">Score</th>
                <th className="text-left px-4 py-3.5 table-header">Stage</th>
                <th className="text-left px-4 py-3.5 table-header hidden xl:table-cell">Added</th>
                <th className="px-4 py-3.5 table-header w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-app transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link to={`/leads/${lead.id}`} className="flex items-center gap-3">
                      <Avatar name={lead.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{lead.name}</p>
                        <p className="text-xs text-text-secondary truncate">{lead.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-text-secondary">{lead.company || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="badge badge-neutral capitalize">{lead.source || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <ScoreBadge score={lead.score} stage={lead.stage} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-4 py-3.5 hidden xl:table-cell">
                    <span className="text-xs text-text-secondary">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCallLead(lead)}
                        title="Outbound call"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <PhoneOutgoing size={14} />
                      </button>
                      <button
                        onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-app transition-all"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                    {openMenu === lead.id && (
                      <div className="absolute right-4 top-10 z-20 bg-white border border-border rounded-xl shadow-dropdown p-1 w-40 animate-slide-up">
                        <Link to={`/leads/${lead.id}`} onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary rounded-lg hover:bg-app transition-colors">
                          <ArrowRight size={13} /> View Details
                        </Link>
                        <button onClick={() => handleDelete(lead.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-danger rounded-lg hover:bg-red-50 transition-colors w-full text-left">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onCreated={lead => { setLeads(l => [lead, ...l]) }}
        />
      )}
      {callLead && <OutboundCallModal lead={callLead} onClose={() => setCallLead(null)} />}
      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}
