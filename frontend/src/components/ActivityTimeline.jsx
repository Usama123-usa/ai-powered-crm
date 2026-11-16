import { Phone, Mail, MessageSquare, ArrowRight, CheckSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const iconMap = {
  call: { Icon: Phone, color: 'bg-purple-100 text-purple-600' },
  email: { Icon: Mail, color: 'bg-blue-100 text-blue-600' },
  note: { Icon: MessageSquare, color: 'bg-gray-100 text-gray-600' },
  stage_change: { Icon: ArrowRight, color: 'bg-green-100 text-green-600' },
  task: { Icon: CheckSquare, color: 'bg-amber-100 text-amber-600' },
}

export default function ActivityTimeline({ activities = [] }) {
  if (!activities.length) return (
    <div className="text-center py-8 text-gray-400 text-sm">No activity yet</div>
  )
  return (
    <div className="space-y-3">
      {activities.map((a, i) => {
        const { Icon, color } = iconMap[a.type] || iconMap.note
        return (
          <div key={a.id} className="flex gap-3 items-start">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm text-gray-800">{a.note || a.type}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
