import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, Plus, AlertCircle, CheckCircle2, Circle, Flame, RefreshCw } from 'lucide-react'
import { tasksApi, teamApi } from '../lib/api'
import Avatar from '../components/Avatar'
import { format, isPast, isToday } from 'date-fns'

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-50', text: 'text-danger', label: 'High', icon: Flame },
  medium: { bg: 'bg-amber-50', text: 'text-warning', label: 'Medium', icon: AlertCircle },
  low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Low', icon: Circle },
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
]

const STATUS_OPTIONS = [
  { key: 'pending',     label: 'Pending',     bg: 'bg-gray-100',   text: 'text-gray-600',  dot: 'bg-gray-400' },
  { key: 'in_progress', label: 'In Progress', bg: 'bg-blue-50',    text: 'text-blue-700',  dot: 'bg-blue-500' },
  { key: 'completed',   label: 'Completed',   bg: 'bg-green-50',   text: 'text-green-700', dot: 'bg-green-500' },
  { key: 'overdue',     label: 'Overdue',     bg: 'bg-red-50',     text: 'text-red-600',   dot: 'bg-red-400' },
]

function StatusPicker({ task, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const isOverdue = task.status !== 'completed' && task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
  const effectiveStatus = isOverdue && task.status === 'pending' ? 'overdue' : task.status
  const current = STATUS_OPTIONS.find(s => s.key === effectiveStatus) || STATUS_OPTIONS[0]

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity ${current.bg} ${current.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.label}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="opacity-60"><path d="M1 2.5l3 3 3-3"/></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-modal border border-slate-100 py-1 min-w-[130px] animate-scale-in">
            {STATUS_OPTIONS.filter(s => s.key !== 'overdue').map(s => (
              <button
                key={s.key}
                onClick={e => { e.stopPropagation(); onStatusChange(task, s.key); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-app transition-colors ${
                  effectiveStatus === s.key ? s.text : 'text-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
                {effectiveStatus === s.key && <Check size={10} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onStatusChange }) {
  const isOverdue = task.status !== 'completed' && task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
  const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.low
  const PIcon = p.icon

  return (
    <div className={`flex items-start gap-3 px-5 py-4 hover:bg-app transition-colors group ${isOverdue ? 'bg-red-50/30' : ''}`}>
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          task.status === 'completed' ? 'bg-success border-success' : 'border-border hover:border-primary'
        }`}
      >
        {task.status === 'completed' && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          {task.lead_name && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Circle size={9} className="fill-primary" /> {task.lead_name}
            </span>
          )}
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'}`}>
              <Clock size={10} />
              {isOverdue ? 'Overdue · ' : ''}{format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {isToday(task.due_date ? new Date(task.due_date) : new Date(0)) && (
            <span className="badge badge-warning">Due today</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${p.bg} ${p.text}`}>
            <PIcon size={10} />
            {p.label}
          </span>
        )}
        {task.assigned_to_name && (
          <Avatar name={task.assigned_to_name} size="xs" />
        )}
        <StatusPicker task={task} onStatusChange={onStatusChange} />
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [team, setTeam] = useState([])
  const [viewFilter, setViewFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending', assigned_to: '' })

  const normalize = t => t.map(task => ({
    ...task,
    lead_name: task.leads?.name || task.lead_name || null,
    assigned_to_name: task.team_members?.name || task.assigned_to_name || null,
  }))

  const load = () => {
    Promise.all([tasksApi.getAll(), teamApi.getAll()]).then(([t, tm]) => {
      setTasks(normalize(t))
      setTeam(tm)
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    await tasksApi.syncFromLeads()
    load()
    setSyncing(false)
  }

  useEffect(() => {
    Promise.all([tasksApi.getAll(), teamApi.getAll()]).then(([t, tm]) => {
      setTeam(tm)
      if (t.length === 0) {
        // Auto-sync leads as tasks on first visit
        tasksApi.syncFromLeads().then(res => {
          if (res.created > 0) load()
          else setTasks(normalize(t))
        }).catch(() => setTasks(normalize(t)))
      } else {
        setTasks(normalize(t))
      }
    })
  }, [])

  const filtered = tasks.filter(t => {
    if (viewFilter === 'all') return true
    if (viewFilter === 'overdue') return t.status !== 'completed' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
    return t.status === viewFilter
  })

  const handleToggle = async task => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await tasksApi.update(task.id, { status: newStatus })
    load()
  }

  const handleStatusChange = async (task, newStatus) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    await tasksApi.update(task.id, { status: newStatus })
    load()
  }

  const getAutoAssignee = () => {
    if (!team.length) return ''
    const taskCounts = {}
    team.forEach(m => { taskCounts[m.id] = 0 })
    tasks.filter(t => t.status !== 'completed').forEach(t => {
      if (t.assigned_to && taskCounts[t.assigned_to] !== undefined) taskCounts[t.assigned_to]++
    })
    const least = team.reduce((a, b) => (taskCounts[a.id] <= taskCounts[b.id] ? a : b))
    return String(least.id)
  }

  const openAddPanel = () => {
    setForm(p => ({ ...p, assigned_to: getAutoAssignee() }))
    setShowAdd(true)
  }

  const handleAdd = async e => {
    if (e?.preventDefault) e.preventDefault()
    if (!form.title.trim()) return
    await tasksApi.create(form)
    setShowAdd(false)
    setForm({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending', assigned_to: '' })
    load()
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status !== 'completed' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{counts.pending} pending · {counts.overdue > 0 ? `${counts.overdue} overdue` : 'all on track'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="btn-secondary text-xs gap-1.5 disabled:opacity-60">
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Leads'}
          </button>
          <button onClick={openAddPanel} className="btn-primary text-xs">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Add task — right-side modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm bg-white h-full shadow-modal flex flex-col"
            style={{ animation: 'slideInRight 0.25s ease' }}
            onClick={e => e.stopPropagation()}>
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">New Task</p>
                <h3 className="text-base font-bold text-slate-900">Create Task</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Panel body */}
            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="label">Task Title *</label>
                <input className="input" placeholder="Follow up with lead…" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={form.due_date}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
              {team.length > 0 && (
                <div>
                  <label className="label">Assign To</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {team.map(member => {
                      const initials = (member.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                      const selected = form.assigned_to === String(member.id)
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, assigned_to: selected ? '' : String(member.id) }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            selected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            selected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>{initials}</span>
                          {member.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </form>

            {/* Panel footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleAdd} className="btn-primary flex-1 justify-center">Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-app border border-border rounded-xl mb-5 overflow-x-auto">
        {STATUS_FILTERS.map(f => (
          <button key={f.key} onClick={() => setViewFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              viewFilter === f.key ? 'bg-white shadow-card text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}>
            {f.label}
            {counts[f.key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                f.key === 'overdue' ? 'bg-red-100 text-danger' : 'bg-app text-text-secondary'
              }`}>{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="card divide-y divide-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <CheckCircle2 size={32} className="text-border mb-3" />
            <p className="text-sm font-semibold text-text-primary">No tasks here</p>
            <p className="text-xs text-text-secondary mt-1">Create a task to stay on top of your work.</p>
          </div>
        ) : (
          filtered.map(task => <TaskRow key={task.id} task={task} onToggle={handleToggle} onStatusChange={handleStatusChange} />)
        )}
      </div>
    </div>
  )
}
