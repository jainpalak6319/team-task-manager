import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'

const StatCard = ({ label, value, sub, accent }) => (
  <div className="card p-5">
    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{label}</div>
    <div className={`text-3xl font-semibold ${accent || 'text-slate-100'}`}>{value ?? '—'}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    todo: 'badge-todo', 'in-progress': 'badge-in-progress',
    review: 'badge-review', done: 'badge-done'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[status] || 'badge-todo'}`}>
      {status}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const map = {
    low: 'badge-low', medium: 'badge-medium',
    high: 'badge-high', urgent: 'badge-urgent'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[priority] || 'badge-medium'}`}>
      {priority}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { stats, recentTasks, overdueTasksList, dueSoonTasks } = data || {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Projects" value={stats?.totalProjects} />
        <StatCard label="Total Tasks" value={stats?.totalTasks} />
        <StatCard label="Completed" value={stats?.doneTasks} accent="text-green-400" sub={`${stats?.completionRate}% done`} />
        <StatCard label="Overdue" value={stats?.overdueTasks} accent={stats?.overdueTasks > 0 ? 'text-red-400' : 'text-slate-100'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="To Do" value={stats?.todoTasks} />
        <StatCard label="In Progress" value={stats?.inProgressTasks} accent="text-blue-400" />
        <StatCard label="In Review" value={stats?.reviewTasks} accent="text-amber-400" />
        <StatCard label="My Open Tasks" value={stats?.myTasks} accent="text-primary-400" />
      </div>

      {/* Progress bar */}
      {stats?.totalTasks > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-300">Overall completion</span>
            <span className="text-sm font-semibold text-primary-400">{stats.completionRate}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />Todo: {stats.todoTasks}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />In Progress: {stats.inProgressTasks}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Review: {stats.reviewTasks}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Done: {stats.doneTasks}</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="md:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Recent activity</h2>
          {recentTasks?.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No tasks yet. <Link to="/projects" className="text-primary-400">Create a project</Link></p>
          ) : (
            <div className="space-y-3">
              {recentTasks?.map(task => (
                <Link key={task._id} to={`/tasks/${task._id}`} className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200 truncate group-hover:text-primary-400 transition-colors">{task.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{task.project?.name} · {task.assignee?.name || 'Unassigned'}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    {task.dueDate && (
                      <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'text-red-400' : 'text-slate-500'}`}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Overdue
            {overdueTasksList?.length > 0 && (
              <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded">{overdueTasksList.length}</span>
            )}
          </h2>
          {overdueTasksList?.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">🎉 No overdue tasks!</p>
          ) : (
            <div className="space-y-2">
              {overdueTasksList?.map(task => (
                <Link key={task._id} to={`/tasks/${task._id}`} className="block p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg transition-colors">
                  <div className="text-sm font-medium text-slate-200 truncate">{task.title}</div>
                  <div className="text-xs text-red-400 mt-0.5">{format(new Date(task.dueDate), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-slate-500">{task.project?.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
