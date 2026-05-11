import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

const STATUS_MAP = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', review: 'badge-review', done: 'badge-done' }
const PRI_MAP = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' })
  const [memberEmail, setMemberEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const isOwnerOrAdmin = project && (
    project.owner?._id === user?._id ||
    project.members?.some(m => m.user?._id === user?._id && m.role === 'admin')
  )

  const fetchAll = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ])
      setProject(pRes.data.project)
      setTasks(tRes.data.tasks)
    } catch { toast.error('Failed to load project') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [id])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks', { ...taskForm, project: id, assignee: taskForm.assignee || undefined })
      toast.success('Task created')
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    } finally { setSaving(false) }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      toast.success('Member added')
      setShowMemberModal(false)
      setMemberEmail('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally { setSaving(false) }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      toast.success('Member removed')
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove') }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) { toast.error('Failed to delete') }
  }

  const filteredTasks = tasks.filter(t => activeTab === 'all' || t.status === activeTab)

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!project) return <div className="p-6 text-slate-400">Project not found.</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/projects" className="text-xs text-slate-500 hover:text-slate-300 mb-2 inline-block">← Projects</Link>
          <h1 className="text-xl font-semibold text-slate-100">{project.name}</h1>
          {project.description && <p className="text-slate-500 text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          {isOwnerOrAdmin && (
            <>
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-xs">+ Member</button>
              <button onClick={() => setShowTaskModal(true)} className="btn-primary text-xs">+ Task</button>
              <button onClick={handleDeleteProject} className="btn-danger text-xs">Delete</button>
            </>
          )}
          {!isOwnerOrAdmin && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary text-xs">+ Task</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tasks column - 3/4 */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
            {['all', 'todo', 'in-progress', 'review', 'done'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab === 'all' ? 'All' : tab} {tab === 'all' ? `(${tasks.length})` : `(${tasks.filter(t => t.status === tab).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">No tasks in this view.</div>
            ) : filteredTasks.map(task => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="card p-4 flex items-center justify-between hover:border-slate-700 transition-colors group block">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 group-hover:text-primary-400 transition-colors truncate">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{task.assignee?.name || 'Unassigned'}</div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRI_MAP[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_MAP[task.status]}`}>{task.status}</span>
                  {task.dueDate && <span className="text-xs text-slate-500">{format(new Date(task.dueDate), 'MMM d')}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar - 1/4 */}
        <div className="space-y-4">
          {/* Project info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project info</h3>
            <div>
              <div className="text-xs text-slate-500">Owner</div>
              <div className="text-sm text-slate-200">{project.owner?.name}</div>
            </div>
            {project.deadline && (
              <div>
                <div className="text-xs text-slate-500">Deadline</div>
                <div className="text-sm text-slate-200">{format(new Date(project.deadline), 'MMM d, yyyy')}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <div className="text-sm text-slate-200 capitalize">{project.status}</div>
            </div>
          </div>

          {/* Members */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Members ({project.members?.length})</h3>
            <div className="space-y-2">
              {project.members?.map(m => (
                <div key={m.user?._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                      {m.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200">{m.user?.name}</div>
                      <div className="text-xs text-slate-500">{m.role}</div>
                    </div>
                  </div>
                  {isOwnerOrAdmin && m.user?._id !== project.owner?._id && (
                    <button onClick={() => handleRemoveMember(m.user?._id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskModal(false)}>
          <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-100 mb-5">New task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none h-20" placeholder="Task description"
                  value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" className="input" value={taskForm.dueDate}
                    onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Assign to</label>
                <select className="input" value={taskForm.assignee} onChange={e => setTaskForm(p => ({ ...p, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Creating...' : 'Create task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowMemberModal(false)}>
          <div className="card w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-100 mb-5">Add member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="label">Member email</label>
                <input type="email" className="input" placeholder="colleague@example.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
