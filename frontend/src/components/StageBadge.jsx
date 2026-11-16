const STAGES = {
  new: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'New' },
  contacted: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Contacted' },
  qualified: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Qualified' },
  emailed: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Appointment' },
  called: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Called' },
  closed: { bg: 'bg-green-50', text: 'text-green-800', label: 'Converted' },
  lost: { bg: 'bg-red-50', text: 'text-red-600', label: 'Lost' },
}

export default function StageBadge({ stage }) {
  const s = STAGES[stage] || { bg: 'bg-gray-100', text: 'text-gray-600', label: stage || 'Unknown' }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
