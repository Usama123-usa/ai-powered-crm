import { useLocation } from 'react-router-dom'
import { Search, Bell, Settings, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const ROUTES = {
  '/':          { title: 'Executive Dashboard', breadcrumb: ['Dashboard'] },
  '/leads':     { title: 'Leads', breadcrumb: ['Leads'] },
  '/pipeline':  { title: 'Lead Pipeline', breadcrumb: ['Pipeline'] },
  '/meetings':  { title: 'Appointments', breadcrumb: ['Appointments'] },
  '/tasks':     { title: 'Tasks', breadcrumb: ['Tasks'] },
  '/analytics': { title: 'Analytics', breadcrumb: ['Analytics'] },
  '/team':      { title: 'Team Performance', breadcrumb: ['Team'] },
  '/settings':  { title: 'Settings', breadcrumb: ['Settings'] },
  '/followup':  { title: 'Follow-ups', breadcrumb: ['Follow-ups'] },
}

export default function Header() {
  const { pathname } = useLocation()
  const [search, setSearch] = useState('')

  const route = ROUTES[pathname] || {
    title: 'Brown Capital',
    breadcrumb: ['CRM'],
  }

  return (
    <header className="h-14 flex items-center gap-4 px-6 flex-shrink-0 glass-panel"
      style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs text-text-muted font-medium">Brown Capital</span>
        {route.breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight size={11} className="text-border" />
            <span className={`text-xs ${i === route.breadcrumb.length - 1
              ? 'text-text-primary font-semibold'
              : 'text-text-secondary'}`}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Global search */}
      <div className="relative w-64">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads, appointments…"
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-app border border-border rounded-xl text-text-primary
                     placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     transition-all duration-150"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="btn-icon relative">
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-danger rounded-full ring-1 ring-white" />
        </button>
        <button className="btn-icon">
          <Settings size={15} />
        </button>

        {/* Avatar */}
        <div className="ml-1 flex items-center gap-2 pl-3 border-l border-border">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer font-display font-bold text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #17264A 100%)' }}
          >
            JB
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-text-primary leading-none">Jarrod Brown</p>
            <p className="text-[10px] text-text-muted leading-none mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
