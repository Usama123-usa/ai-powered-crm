import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Kanban, Calendar,
  CheckSquare, BarChart3, UserCheck, Settings,
  LogOut, ArrowUpRight, FileText, RefreshCw
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/leads',      icon: Users,           label: 'Leads'        },
  { to: '/pipeline',   icon: Kanban,          label: 'Lead Pipeline' },
  { to: '/meetings',   icon: Calendar,        label: 'Appointments' },
  { to: '/followup',   icon: RefreshCw,       label: 'Follow-ups'   },
  { to: '/tasks',      icon: CheckSquare,     label: 'Tasks'        },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics'    },
  { to: '/team',       icon: UserCheck,       label: 'Team'         },
]

export default function Navbar() {
  return (
    <aside
      className="w-72 bg-white text-slate-700 flex-shrink-0 flex flex-col justify-between border-r border-slate-200 z-20 h-screen select-none"
    >
      {/* ── Top section ── */}
      <div className="p-5 flex flex-col flex-1 overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-3.5 pb-6 pt-1 border-b border-slate-100">
          <div className="relative w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base text-slate-900 tracking-wide truncate">BROWN CAPITAL</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 truncate">Private Wealth CRM</span>
          </div>
        </div>

        {/* Nav */}
        <div className="mt-6">
          <div className="px-3 mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Executive Navigation
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 shadow-sm transition-all duration-150'
                    : 'group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150'
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="w-1.5 h-5 bg-blue-600 rounded-full absolute -left-1" />
                    )}
                    <Icon
                      size={16}
                      className={isActive
                        ? 'text-blue-600 group-hover:scale-110 transition-transform'
                        : 'text-slate-400 group-hover:text-slate-600 transition-colors'}
                      strokeWidth={isActive ? 2.2 : 2}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Lead Capture Form link */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <a
              href="/form"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-50 border border-blue-200/60 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-blue-600" />
                <span>Lead Capture Form</span>
              </div>
              <ArrowUpRight size={14} className="text-blue-600" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom: Settings + User ── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              isActive
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`
          }
        >
          <Settings size={16} className="text-slate-400" />
          <span>Platform Settings</span>
        </NavLink>

        {/* User card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-sm flex-shrink-0">
              JB
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-bold text-slate-800 truncate">Jarrod Brown</span>
              <span className="text-[10px] text-slate-500 truncate">Administrator</span>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
