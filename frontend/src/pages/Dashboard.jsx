import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Phone, Calendar, Target, ArrowUpRight, ArrowDownRight,
  Plus, ChevronRight, Zap, BarChart2
} from 'lucide-react'
import { leadsApi, analyticsApi, meetingsApi } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STAGE_ORDER = ['new','contacted','emailed','qualified','closed']
const STAGE_LABEL = { new:'New', contacted:'Contacted', emailed:'Appt. Booked', qualified:'Qualified', closed:'Won', lost:'Lost' }

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── KPI Card (matches pasted design) ─────────────────────────────────
function KpiCard({ label, value, suffix = '', iconBg, iconColor, icon: Icon, change, subLabel }) {
  const isPos = change >= 0
  return (
    <div className="rounded-2xl bg-white p-5 border border-slate-200/90 flex flex-col justify-between group"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
          style={{ background: iconBg, borderColor: iconColor + '33' }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: isPos ? '#F0FDF4' : '#FEF2F2', color: isPos ? '#15803D' : '#DC2626', border: `1px solid ${isPos ? '#BBF7D0' : '#FECACA'}` }}>
          {isPos ? <ArrowUpRight size={11} strokeWidth={2.5} /> : <ArrowDownRight size={11} strokeWidth={2.5} />}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="mt-6">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1 flex items-center justify-between">
          <span>{label}</span>
          {subLabel && <span className="text-[10px] font-semibold" style={{ color: iconColor }}>{subLabel}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Pipeline Chart (matches pasted SVG style) ─────────────────────────
function PipelineChart({ stages }) {
  const stageData = STAGE_ORDER.map(s => ({
    key: s,
    label: STAGE_LABEL[s] || s,
    count: stages?.find(x => x.stage === s)?.count || 0,
  }))
  const total = stageData.reduce((a, b) => a + b.count, 0) || 1

  return (
    <div>
      {/* SVG chart */}
      <div className="p-3.5 rounded-xl border" style={{ background: 'linear-gradient(to bottom, rgba(248,250,252,0.9), rgba(239,246,255,0.2))', borderColor: '#E2E8F0' }}>
        <div className="flex items-center justify-between mb-2 text-[11px] font-medium text-slate-500">
          <span>Pipeline Stage Volume</span>
          <span className="font-mono text-slate-700 font-semibold">Total Capacity: {total} / 20</span>
        </div>
        <svg viewBox="0 0 520 110" className="w-full h-28 overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipeBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="pipeArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.01" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="0" x2="520" y1="20" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="0" x2="520" y1="55" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="0" x2="520" y1="90" stroke="#E2E8F0" strokeWidth="1" />
          <path d="M 40 45 C 90 45, 110 45, 150 45 C 190 45, 220 88, 260 88 C 300 88, 330 88, 370 88 C 410 88, 440 88, 480 88 L 480 90 L 40 90 Z" fill="url(#pipeArea)" />
          <path d="M 40 45 C 90 45, 110 45, 150 45 C 190 45, 220 88, 260 88 C 300 88, 330 88, 370 88 C 410 88, 440 88, 480 88" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
          {[{ x: 26, cy: 45, active: stageData[0].count > 0 }, { x: 136, cy: 45, active: stageData[1].count > 0 }, { x: 246, cy: 88, active: false }, { x: 356, cy: 88, active: false }, { x: 466, cy: 88, active: false }].map((b, i) => (
            <g key={i} opacity={b.active ? 1 : 0.4}>
              {b.active ? (
                <>
                  <rect x={b.x} y={b.cy} width="28" height={90 - b.cy} rx="4" fill="url(#pipeBlue)" />
                  <circle cx={b.x + 14} cy={b.cy} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                </>
              ) : (
                <>
                  <rect x={b.x} y="84" width="28" height="6" rx="3" fill="#CBD5E1" />
                  <circle cx={b.x + 14} cy="88" r="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                </>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Stage breakdown pills */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {stageData.map(({ key, label, count }) => {
          const pct = Math.round((count / total) * 100)
          const active = count > 0
          return (
            <div key={key} className="p-2 rounded-lg border"
              style={active ? { background: '#EFF6FF', borderColor: 'rgba(37,99,235,0.3)' } : { background: '#F8FAFC', borderColor: 'rgba(226,232,240,0.6)', opacity: 0.7 }}>
              <div className="text-[10px] font-medium uppercase tracking-wider truncate" style={{ color: active ? '#475569' : '#94A3B8' }}>{label}</div>
              <div className="font-mono font-bold text-sm mt-0.5" style={{ color: active ? '#0F172A' : '#94A3B8' }}>{count}</div>
              <div className="text-[10px] font-semibold" style={{ color: active ? '#2563EB' : '#94A3B8' }}>{active ? pct + '%' : '0%'}</div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>Avg Velocity: <strong className="text-slate-700">2.4 days/stage</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Conversion: <strong className="text-blue-700 font-semibold">100%</strong></span>
          <span>Pipeline Value: <strong className="text-slate-900 font-mono">$1.45M</strong></span>
        </div>
      </div>
    </div>
  )
}

// ── Lead Sources donut ────────────────────────────────────────────────
function LeadSources({ leads }) {
  const sourceCounts = leads.reduce((acc, l) => {
    const s = l.source || 'unknown'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})
  const total = leads.length || 1
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]
  const topPct = topSource ? Math.round((topSource[1] / total) * 100) : 0

  const sourceColors = ['#2563EB', '#7C3AED', '#0891B2', '#059669', '#D97706']
  const rows = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count], i) => ({ source, count, color: sourceColors[i % sourceColors.length], pct: Math.round((count / total) * 100) }))

  return (
    <div>
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
            <defs>
              <linearGradient id="donutBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="60%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="46" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
            <circle cx="60" cy="60" r="46" fill="transparent" stroke="url(#donutBlue)"
              strokeDasharray={`${(topPct / 100) * 289} ${289 - (topPct / 100) * 289}`}
              strokeDashoffset="0" strokeLinecap="round" strokeWidth="12" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{total}</span>
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{topPct}% {topSource ? topSource[0] : ''}</span>
            <span className="text-[9px] text-slate-400">Total Leads</span>
          </div>
        </div>

        {/* Source rows */}
        <div className="flex-1 w-full space-y-2.5">
          {rows.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No leads yet.</p>
          )}
          {rows.map(({ source, count, color, pct }) => (
            <div key={source} className="p-2.5 rounded-xl border transition-all"
              style={{ background: '#EFF6FF66', borderColor: 'rgba(37,99,235,0.2)' }}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-blue-200 flex-shrink-0" style={{ background: color }} />
                  <span className="font-semibold text-slate-800 truncate text-[11px] capitalize">{source}</span>
                </div>
                <span className="font-mono font-bold text-blue-700 text-xs">{count} ({pct}%)</span>
              </div>
              <div className="mt-1.5 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.15)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(to right, #1D4ED8, ${color})` }} />
              </div>
            </div>
          ))}
          {/* Empty placeholders */}
          {['Inbound Referral', 'Direct Advisory'].map(label => (
            <div key={label} className="p-2.5 rounded-xl border border-dashed border-slate-200 opacity-60">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600 truncate text-[11px]">{label}</span>
                </div>
                <span className="font-mono text-slate-400 text-xs">0 (0%)</span>
              </div>
              <div className="mt-1.5 w-full bg-slate-200 h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Attribution: <strong className="text-slate-700 font-semibold">First-touch UTM</strong></span>
        <Link to="/analytics" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors text-[11px]">
          <span>Channel Insights</span>
          <ChevronRight size={11} />
        </Link>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [leads, setLeads]         = useState([])
  const [meetings, setMeetings]   = useState([])
  const [loading, setLoading]     = useState(true)

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateStr = new Date().toISOString().split('T')[0]

  const loadData = useCallback(() => {
    Promise.all([analyticsApi.get(), leadsApi.getAll(), meetingsApi.getAll()])
      .then(([a, l, m]) => { setAnalytics(a); setLeads(l.slice(0, 7)); setMeetings(m); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'confirmed').slice(0, 5)
  const todayCount = meetings.filter(m => m.meeting_date === dateStr && (m.status === 'scheduled' || m.status === 'confirmed')).length

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="px-6 md:px-8 py-7 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">

      {/* ── Welcome Banner ── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{getGreeting()}, Jarrod</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Markets Active
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-medium text-slate-700">{today}</span>
            <span>·</span>
            <span>Your private practice &amp; capital pipeline at a glance</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leads"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <Plus size={13} strokeWidth={2.5} />
            New Lead
          </Link>
          <Link to="/meetings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <Calendar size={13} />
            Book Appointment
          </Link>
        </div>
      </section>

      {/* ── 4 KPI Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads"   value={analytics?.total_leads ?? 0}       icon={Users}    iconBg="#EFF6FF" iconColor="#2563EB" change={12} subLabel="Active Cycle" />
        <KpiCard label="Calls Made"    value={analytics?.calls_made ?? 0}         icon={Phone}    iconBg="#F5F3FF" iconColor="#7C3AED" change={8}  subLabel="100% Target Met" />
        <KpiCard label="Appointments"  value={upcoming.length}                    icon={Calendar} iconBg="#ECFEFF" iconColor="#0891B2" change={15} subLabel={`${todayCount} Today`} />
        <KpiCard label="Conversion"    value={analytics?.conversion_rate ?? 0}    icon={Target}   iconBg="#F0FDF4" iconColor="#16A34A" change={5}  suffix="%" subLabel="Target: 25%" />
      </section>

      {/* ── Mid: Pipeline + Sources ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sales Pipeline — 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Sales Pipeline</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Q4 Mandates</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Volume and conversion distribution across active stages</p>
            </div>
            <Link to="/pipeline" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">
              <span>Manage</span>
              <ChevronRight size={13} />
            </Link>
          </div>
          <PipelineChart stages={analytics?.stage_distribution} />
        </div>

        {/* Lead Sources — 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Lead Sources</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Live Attribution</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Acquisition channels performance</p>
            </div>
            <div className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200/50">
              <BarChart2 size={16} />
            </div>
          </div>
          <LeadSources leads={leads} />
        </div>
      </section>

      {/* ── Bottom: Appointments + Recent Leads ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Upcoming Appointments — 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-400 mt-0.5">{todayCount} scheduled for today</p>
            </div>
            <Link to="/meetings" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">
              All <ChevronRight size={13} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="my-8 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-200" style={{ background: 'rgba(248,250,252,0.7)' }}>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <Calendar size={22} className="text-slate-300" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">No scheduled sessions</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Your calendar is clear. Coordinate with pending leads to secure briefing slots.</p>
              <Link to="/form" target="_blank"
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                + Schedule Call
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {upcoming.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: i === 0 ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${i === 0 ? '#BFDBFE' : '#E2E8F0'}` }}>
                    <span className="text-[9px] font-bold uppercase" style={{ color: i === 0 ? '#2563EB' : '#64748B' }}>
                      {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none" style={{ color: i === 0 ? '#2563EB' : '#0F172A' }}>
                      {new Date(m.meeting_date + 'T12:00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{m.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.meeting_time} · {m.duration_minutes}min</p>
                  </div>
                  {i === 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">Today</span>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Google Calendar Synced
            </span>
            <span>Timezone: AEST (UTC+11)</span>
          </div>
        </div>

        {/* Recent Leads — 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900">Recent Leads</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest acquisitions requiring attention</p>
            </div>
            <Link to="/leads" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">
              All leads <ChevronRight size={13} />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {leads.length === 0 && (
              <div className="text-center py-10">
                <Zap size={20} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No leads yet.</p>
              </div>
            )}
            {leads.map(lead => {
              const initials = getInitials(lead.name)
              const stageCfg = { new: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'New' }, contacted: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', label: 'Called' }, emailed: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', label: 'Appt. Set' }, qualified: { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC', label: 'Qualified' }, closed: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', label: 'Won' } }
              const cfg = stageCfg[lead.stage] || { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', label: lead.stage }
              return (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border flex-shrink-0"
                      style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{lead.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border" style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{lead.company || lead.service_interest || 'General Inquiry'} · {lead.source || 'Web Inbound'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {lead.aum_estimate && (
                      <div className="hidden sm:block text-right">
                        <span className="text-xs font-mono font-bold text-slate-800">{lead.aum_estimate}</span>
                        <p className="text-[10px] text-slate-400">Est. AUM</p>
                      </div>
                    )}
                    <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors" title="Dial client"
                      onClick={e => e.preventDefault()}>
                      <Phone size={14} />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Showing {leads.length} of {analytics?.total_leads ?? leads.length} active prospects</span>
            <span className="text-slate-500 font-medium">Auto-refresh: 30s</span>
          </div>
        </div>
      </section>
    </div>
  )
}
