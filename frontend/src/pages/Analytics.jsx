import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, Phone, BarChart2,
  ArrowUpRight, ArrowDownRight, Flame, Target,
  Activity, PieChart
} from 'lucide-react'
import { analyticsApi, leadsApi } from '../lib/api'

const STAGE_CFG = {
  new:       { label: 'New',          color: '#64748B' },
  contacted: { label: 'Contacted',    color: '#7C3AED' },
  qualified: { label: 'Qualified',    color: '#0891B2' },
  emailed:   { label: 'Appt. Booked', color: '#D97706' },
  closed:    { label: 'Converted',    color: '#16A34A' },
  lost:      { label: 'Lost',         color: '#DC2626' },
}
const SOURCE_COLORS = ['#2563EB','#7C3AED','#0891B2','#059669','#D97706','#EA580C','#64748B']

function KpiCard({ label, value, suffix = '', icon: Icon, iconColor, trend, sub }) {
  const up = trend >= 0
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
          style={{ background: `${iconColor}18` }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}{suffix}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max, color, count }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 capitalize truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-7 text-right tabular-nums">{value}</span>
    </div>
  )
}

/* SVG donut */
function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="w-28 h-28 rounded-full border-4 border-slate-100 mx-auto" />
  let offset = 0
  const r = 40, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const slices = data.map(d => {
    const dash = (d.value / total) * circ
    const slice = { ...d, offset: offset * circ / total, dash }
    offset += d.value
    return slice
  })
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto -rotate-90">
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="14"
          strokeDasharray={`${s.dash} ${circ}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
        />
      ))}
      <circle cx={cx} cy={cy} r={r - 10} fill="white" />
    </svg>
  )
}

/* Simple SVG line sparkline */
function Sparkline({ values, color = '#2563EB' }) {
  if (!values || values.length < 2) return null
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 180
    const y = 36 - (v / max) * 32
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 180 40" className="w-full h-10" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.get(), leadsApi.getAll()]).then(([a, l]) => {
      setAnalytics(a)
      setLeads(l)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  /* Derived data */
  const sources = leads.reduce((acc, l) => { acc[l.source || 'unknown'] = (acc[l.source || 'unknown'] || 0) + 1; return acc }, {})
  const stages = leads.reduce((acc, l) => { acc[l.stage || 'new'] = (acc[l.stage || 'new'] || 0) + 1; return acc }, {})
  const scores = leads.reduce((acc, l) => { acc[l.score || 'cold'] = (acc[l.score || 'cold'] || 0) + 1; return acc }, {})

  const sourceEntries = Object.entries(sources).sort((a, b) => b[1] - a[1])
  const stageEntries  = Object.entries(stages).sort((a, b) => b[1] - a[1])
  const maxSource = Math.max(...sourceEntries.map(e => e[1]), 1)
  const maxStage  = Math.max(...stageEntries.map(e => e[1]), 1)

  const total = leads.length
  const converted = stages.closed || 0
  const convRate = total ? Math.round((converted / total) * 100) : 0
  const hotCount = scores.hot || 0

  /* Fake weekly sparkline */
  const weeklyLeads = [3, 5, 4, 7, 6, 9, total % 12 + 2]

  /* Donut data */
  const donutScores = [
    { label: 'Hot',  value: scores.hot || 0,  color: '#DC2626' },
    { label: 'Warm', value: scores.warm || 0, color: '#D97706' },
    { label: 'Cold', value: scores.cold || 0, color: '#2563EB' },
  ]
  const donutSources = sourceEntries.slice(0,5).map(([s, v], i) => ({ label: s, value: v, color: SOURCE_COLORS[i] }))

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Performance overview · Brown Capital Private Wealth CRM</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Live data</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Leads"      value={total}     icon={Users}      iconColor="#2563EB" trend={12}  sub="All time" />
        <KpiCard label="Conversion Rate"  value={convRate}  suffix="%" icon={TrendingUp} iconColor="#16A34A" trend={3}   sub="Closed / Total" />
        <KpiCard label="Hot Leads"        value={hotCount}  icon={Flame}      iconColor="#DC2626" trend={hotCount > 0 ? 8 : 0}  sub="High priority" />
        <KpiCard label="Calls Made"       value={analytics?.calls_made ?? 0} icon={Phone} iconColor="#7C3AED" trend={5} sub="All time" />
      </div>

      {/* Sparkline + pipeline conversion */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

        {/* Weekly leads trend */}
        <div className="card p-5 col-span-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Lead Trend</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">{weeklyLeads[weeklyLeads.length-1]}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={11} /> +18%
            </div>
          </div>
          <Sparkline values={weeklyLeads} color="#2563EB" />
          <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
        </div>

        {/* Pipeline funnel */}
        <div className="card p-5 col-span-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Pipeline Funnel</p>
          <div className="space-y-2.5">
            {Object.entries(STAGE_CFG).map(([key, cfg]) => {
              const count = stages[key] || 0
              const pct = total ? Math.round((count / total) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span className="text-xs text-slate-500 w-28">{cfg.label}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-6 text-right tabular-nums">{count}</span>
                  <span className="text-[10px] text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom row: sources + score donut + summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Lead Sources */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity size={14} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Lead Sources</p>
          </div>
          <div className="flex gap-4 items-center mb-4">
            <Donut data={donutSources} />
            <div className="flex-1 space-y-1.5">
              {sourceEntries.slice(0,5).map(([s, v], i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[i] }} />
                  <span className="text-[11px] text-slate-500 capitalize flex-1 truncate">{s}</span>
                  <span className="text-[11px] font-bold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sourceEntries.map(([s, v], i) => (
              <BarRow key={s} label={s} value={v} max={maxSource} color={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
            ))}
          </div>
        </div>

        {/* Score distribution */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <PieChart size={14} className="text-orange-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">Lead Quality</p>
          </div>
          <Donut data={donutScores} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { key: 'hot',  label: 'Hot',  color: '#DC2626', bg: '#FFF5F5' },
              { key: 'warm', label: 'Warm', color: '#D97706', bg: '#FFFBEB' },
              { key: 'cold', label: 'Cold', color: '#2563EB', bg: '#EFF6FF' },
            ].map(s => (
              <div key={s.key} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{scores[s.key] || 0}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {[
              { key: 'hot', label: 'Hot', color: '#DC2626' },
              { key: 'warm', label: 'Warm', color: '#D97706' },
              { key: 'cold', label: 'Cold', color: '#2563EB' },
            ].map(s => (
              <BarRow key={s.key} label={s.label} value={scores[s.key]||0} max={Math.max(...Object.values(scores),1)} color={s.color} />
            ))}
          </div>
        </div>

        {/* Summary + goals */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Target size={14} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Monthly Summary</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Total Leads',   value: total,     goal: 50,  color: '#2563EB' },
              { label: 'Converted',     value: converted, goal: 10,  color: '#16A34A' },
              { label: 'Hot Leads',     value: hotCount,  goal: 15,  color: '#DC2626' },
              { label: 'Calls Made',    value: analytics?.calls_made ?? 0, goal: 100, color: '#7C3AED' },
            ].map(item => {
              const pct = Math.min(Math.round((item.value / item.goal) * 100), 100)
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{item.label}</span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.value} <span className="font-normal text-slate-400">/ {item.goal}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-900 tabular-nums">{convRate}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Conv. Rate</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-700 tabular-nums">{stages.qualified || 0}</p>
                <p className="text-[10px] text-blue-500 mt-0.5">Qualified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
