const SCORES = {
  hot: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Hot' },
  warm: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Warm' },
  cold: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Cold' },
}

const STAGE_OVERRIDES = {
  emailed:   { bg: 'bg-cyan-50',    text: 'text-cyan-700',   dot: 'bg-cyan-500',   label: 'Appt. Booked' },
  closed:    { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500',label: 'Converted' },
  lost:      { bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-400',    label: 'Lost' },
}

export default function ScoreBadge({ score, stage }) {
  const s = STAGE_OVERRIDES[stage] || SCORES[score] || SCORES.cold
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
