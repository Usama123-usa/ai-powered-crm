const PALETTES = [
  ['#2563EB', '#1d4ed8'], ['#7C3AED', '#6d28d9'], ['#059669', '#047857'],
  ['#0891B2', '#0e7490'], ['#D97706', '#b45309'], ['#DC2626', '#b91c1c'],
  ['#C6A76A', '#a8894f'], ['#17264A', '#0B1530'],
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPalette(name) {
  if (!name) return PALETTES[0]
  const idx = name.charCodeAt(0) % PALETTES.length
  return PALETTES[idx]
}

const SIZES = {
  xs: { container: 'w-6 h-6 rounded-lg', text: 'text-[9px]' },
  sm: { container: 'w-8 h-8 rounded-xl', text: 'text-xs' },
  md: { container: 'w-10 h-10 rounded-xl', text: 'text-sm' },
  lg: { container: 'w-12 h-12 rounded-2xl', text: 'text-base' },
  xl: { container: 'w-16 h-16 rounded-2xl', text: 'text-xl' },
}

export default function Avatar({ name, size = 'sm' }) {
  const initials = getInitials(name)
  const [from, to] = getPalette(name)
  const { container, text } = SIZES[size] || SIZES.sm

  return (
    <div
      className={`${container} flex items-center justify-center flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className={`${text} font-bold text-white leading-none`}>{initials}</span>
    </div>
  )
}
