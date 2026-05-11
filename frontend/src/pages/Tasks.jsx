import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { format, isPast } from 'date-fns'

const STATUS_MAP = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', review: 'badge-review', done: 'badge-done' }
const PRI_MAP = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/tasks/my/assigned')
      .then(res => setTasks(res.data.tasks))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-100">My Tasks</h1>
        <p className="text-slate-500 text-sm mt-0.5">{tasks.length} tasks assigned to you</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
        {['all', 'todo', 'in-progress', 'review', 'done'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === tab ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab === 'all' ? 'All' : tab} ({tab === 'all' ? tasks.length : tasks.filter(t => t.status === tab).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 mb-2">No tasks found</p>
          <p className="text-slate-600 text-sm">Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done'
            return (
              <Link key={task._id} to={`/tasks/${task._id}`} className={`card p-4 flex items-center justify-between hover:border-slate-700 transition-colors group block ${overdue ? 'border-red-500/20' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 group-hover:text-primary-400 transition-colors truncate">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{task.project?.name}</span>
                    <span>·</span>
                    <span>by {task.createdBy?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRI_MAP[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_MAP[task.status]}`}>{task.status}</span>
                  {task.dueDate && (
                    <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                      {overdue ? 'Overdue · ' : ''}{format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
