import { useState, useEffect } from 'react'
import {
  UserCheck, Phone, Mail, TrendingUp, Award, Star,
  Plus, X, Edit2, ArrowUpRight, ArrowDownRight,
  Target, Zap, Shield, ChevronRight, BarChart2,
  CheckCircle, Clock, Users
} from 'lucide-react'

const MOCK_TEAM = [
  {
    id: '1', name: 'Jarrod Brown', role: 'Managing Director', initials: 'JB',
    color: 'linear-gradient(135deg,#2563EB,#17264A)',
    email: 'jarrod@browncapital.com', phone: '+1 (212) 555-0101',
    leads: 48, calls: 32, conversions: 12, revenue: 4200000,
    target: 5000000, trend: +18, rank: 1,
    badges: ['Top Closer', 'Elite'],
    weekly: [4, 6, 5, 8, 7, 9, 12],
  },
  {
    id: '2', name: 'Sarah Mitchell', role: 'Senior Advisor', initials: 'SM',
    color: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
    email: 'sarah@browncapital.com', phone: '+1 (212) 555-0102',
    leads: 36, calls: 28, conversions: 9, revenue: 3100000,
    target: 4000000, trend: +11, rank: 2,
    badges: ['Consistent'],
    weekly: [3, 4, 5, 4, 6, 7, 9],
  },
  {
    id: '3', name: 'Marcus Chen', role: 'Wealth Advisor', initials: 'MC',
    color: 'linear-gradient(135deg,#059669,#065F46)',
    email: 'marcus@browncapital.com', phone: '+1 (212) 555-0103',
    leads: 29, calls: 22, conversions: 7, revenue: 2400000,
    target: 3000000, trend: -4, rank: 3,
    badges: [],
    weekly: [5, 3, 4, 3, 2, 4, 7],
  },
  {
    id: '4', name: 'Priya Kapoor', role: 'Associate Advisor', initials: 'PK',
    color: 'linear-gradient(135deg,#EA580C,#9A3412)',
    email: 'priya@browncapital.com', phone: '+1 (212) 555-0104',
    leads: 21, calls: 18, conversions: 5, revenue: 1800000,
    target: 2500000, trend: +22, rank: 4,
    badges: ['Rising Star'],
    weekly: [1, 2, 2, 3, 4, 4, 5],
  },
]

const fmtCcy = n => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

/* ── Sparkline ── */
function Spark({ data, color = '#2563EB' }) {
  const max = Math.max(...data, 1)
  const w = 72, h = 28, pad = 2
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = h - pad - (v / max) * (h - pad * 2)
        return i === data.length - 1
          ? <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
          : null
      })}
    </svg>
  )
}

/* ── Member Card ── */
function MemberCard({ member, rank, onClick }) {
  const pct = Math.min(100, Math.round((member.revenue / member.target) * 100))
  const isUp = member.trend > 0
  const rankColors = ['', '#F59E0B', '#94A3B8', '#CD7F32']

  return (
    <div
      onClick={() => onClick(member)}
      className="card cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* Top accent bar */}
      <div className="h-1" style={{ background: member.color }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: member.color }}>
                {member.initials}
              </div>
              {rank <= 3 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: rankColors[rank] || '#94A3B8' }}>
                  {rank}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{member.role}</p>
            </div>
          </div>

          {/* Trend */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(member.trend)}%
          </div>
        </div>

        {/* Revenue + sparkline */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{fmtCcy(member.revenue)}</p>
            <p className="text-xs text-slate-400 mt-0.5">of {fmtCcy(member.target)} target</p>
          </div>
          <Spark data={member.weekly} color={isUp ? '#059669' : '#DC2626'} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500">Pipeline progress</span>
            <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#059669' : pct >= 50 ? '#2563EB' : '#F59E0B'
              }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Leads',  value: member.leads },
            { label: 'Calls',  value: member.calls },
            { label: 'Closed', value: member.conversions },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl bg-slate-50">
              <p className="text-sm font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap min-h-[22px]">
          {member.badges.map(b => (
            <span key={b} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              <Star size={8} /> {b}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-300 group-hover:text-blue-500 transition-colors flex items-center gap-0.5">
            Details <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Member Detail Panel ── */
function MemberPanel({ member, onClose }) {
  if (!member) return null
  const pct = Math.min(100, Math.round((member.revenue / member.target) * 100))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal animate-slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative h-24 overflow-hidden" style={{ background: member.color }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%,white 0%,transparent 60%)' }} />
          <div className="absolute bottom-4 left-5 flex items-end gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold border border-white/30">
              {member.initials}
            </div>
            <div className="pb-0.5">
              <p className="text-white font-bold text-base">{member.name}</p>
              <p className="text-white/70 text-xs">{member.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contact</p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Mail size={13} className="text-slate-400" /> {member.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone size={13} className="text-slate-400" /> {member.phone}
            </div>
          </div>

          {/* Revenue target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue vs Target</p>
              <span className="text-xs font-bold text-slate-700">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full" style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#059669' : pct >= 50 ? '#2563EB' : '#F59E0B'
              }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{fmtCcy(member.revenue)} earned</span>
              <span>{fmtCcy(member.target)} goal</span>
            </div>
          </div>

          {/* Weekly trend chart */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">7-Day Calls Trend</p>
            <div className="bg-slate-50 rounded-xl p-3 flex justify-center">
              <Spark data={member.weekly} color="#2563EB" />
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Leads',   value: member.leads,       Icon: Users,    color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Calls Made',    value: member.calls,       Icon: Phone,    color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Conversions',   value: member.conversions, Icon: CheckCircle, color: '#059669', bg: '#F0FDF4' },
              { label: 'Win Rate',
                value: `${Math.round((member.conversions / member.leads) * 100)}%`,
                Icon: Target, color: '#D97706', bg: '#FFFBEB' },
            ].map(k => (
              <div key={k.label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: k.bg }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${k.color}20` }}>
                  <k.Icon size={13} style={{ color: k.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{k.value}</p>
                  <p className="text-[10px] text-slate-500">{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Add/Edit Modal ── */
function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || {
    name: '', role: '', email: '', phone: '', initials: '',
    color: 'linear-gradient(135deg,#2563EB,#17264A)',
    leads: 0, calls: 0, conversions: 0, revenue: 0, target: 1000000, trend: 0,
    badges: [], weekly: [1,1,1,1,1,1,1],
  })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{member ? 'Edit Member' : 'Add Team Member'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Initials</label>
              <input className="input" value={form.initials} onChange={set('initials')} placeholder="JS" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="label">Role / Title</label>
            <input className="input" value={form.role} onChange={set('role')} placeholder="Senior Advisor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Revenue Target ($)</label>
              <input className="input" type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Current Revenue ($)</label>
              <input className="input" type="number" value={form.revenue} onChange={e => setForm(p => ({ ...p, revenue: +e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => { onSave(form); onClose() }} className="btn-primary flex-1 justify-center">
            {member ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Team() {
  const [team, setTeam]         = useState(MOCK_TEAM)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)

  const totalRevenue    = team.reduce((s, m) => s + m.revenue, 0)
  const totalTarget     = team.reduce((s, m) => s + m.target, 0)
  const totalLeads      = team.reduce((s, m) => s + m.leads, 0)
  const totalConversions = team.reduce((s, m) => s + m.conversions, 0)
  const teamWinRate     = Math.round((totalConversions / totalLeads) * 100)

  const KPI_STATS = [
    { label: 'Team Revenue',    value: fmtCcy(totalRevenue),    sub: `of ${fmtCcy(totalTarget)} target`, Icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Total Leads',     value: totalLeads,              sub: 'across all advisors',               Icon: Users,      color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Conversions',     value: totalConversions,        sub: `${teamWinRate}% win rate`,           Icon: CheckCircle,color: '#059669', bg: '#F0FDF4' },
    { label: 'Team Size',       value: team.length,             sub: 'active advisors',                   Icon: UserCheck,  color: '#D97706', bg: '#FFFBEB' },
  ]

  const sorted = [...team].sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Team Performance</h1>
          <p className="page-subtitle">{team.length} advisors · {teamWinRate}% team win rate</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} /> Add Member
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPI_STATS.map(stat => (
          <div key={stat.label} className="card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.bg }}>
              <stat.Icon size={17} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Member cards (2/3) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((m, i) => (
            <MemberCard key={m.id} member={m} rank={i + 1} onClick={setSelected} />
          ))}
        </div>

        {/* Leaderboard (1/3) */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Leaderboard</p>
                <p className="text-[11px] text-slate-400">By revenue closed</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {sorted.map((m, i) => {
              const pct = Math.min(100, Math.round((m.revenue / sorted[0].revenue) * 100))
              const rankMedals = ['🥇','🥈','🥉']
              return (
                <div key={m.id}
                  className="px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  onClick={() => setSelected(m)}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-sm w-5 text-center">{rankMedals[i] || `${i+1}`}</span>
                    <div className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                      style={{ background: m.color }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m.role}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 tabular-nums flex-shrink-0">{fmtCcy(m.revenue)}</span>
                  </div>
                  <div className="pl-7 ml-2.5">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7F32' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Team total */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-medium">Team Total</span>
              <span className="text-sm font-bold text-slate-900">{fmtCcy(totalRevenue)}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((totalRevenue / totalTarget) * 100))}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">
              {Math.round((totalRevenue / totalTarget) * 100)}% of {fmtCcy(totalTarget)} goal
            </p>
          </div>
        </div>
      </div>

      {/* Activity feed strip */}
      <div className="mt-6 card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-amber-500" />
            <p className="text-sm font-bold text-slate-900">Recent Activity</p>
          </div>
          <span className="text-xs text-slate-400">This week</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            { who: 'JB', action: 'Closed deal', detail: 'Goldman Group — $420K', time: '2h ago', color: 'linear-gradient(135deg,#2563EB,#17264A)' },
            { who: 'SM', action: 'Booked appointment', detail: 'Chen Family Office', time: '4h ago', color: 'linear-gradient(135deg,#7C3AED,#5B21B6)' },
            { who: 'PK', action: 'New lead added', detail: 'Riviera Capital', time: '5h ago', color: 'linear-gradient(135deg,#EA580C,#9A3412)' },
            { who: 'MC', action: 'Sent proposal', detail: 'Park Avenue Partners', time: 'Yesterday', color: 'linear-gradient(135deg,#059669,#065F46)' },
            { who: 'JB', action: 'Follow-up call', detail: 'Lakeview Holdings', time: 'Yesterday', color: 'linear-gradient(135deg,#2563EB,#17264A)' },
          ].map((a, i) => (
            <div key={i} className="flex-shrink-0 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 min-w-[200px]">
              <div className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                style={{ background: a.color }}>
                {a.who}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">{a.action}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{a.detail}</p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={9} />{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selected  && <MemberPanel member={selected} onClose={() => setSelected(null)} />}
      {showAdd   && <MemberModal onClose={() => setShowAdd(false)} onSave={m => setTeam(p => [...p, { ...m, id: Date.now().toString(), rank: p.length + 1 }])} />}
      {editing   && <MemberModal member={editing} onClose={() => setEditing(null)} onSave={m => setTeam(p => p.map(x => x.id === m.id ? m : x))} />}
    </div>
  )
}
