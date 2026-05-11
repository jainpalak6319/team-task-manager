import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['todo', 'in-progress', 'review', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

export default function TaskDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTask = () => {
    api.get(`/tasks/${id}`)
      .then(res => {
        setTask(res.data.task)
        setForm({
          title: res.data.task.title,
          description: res.data.task.description,
          status: res.data.task.status,
          priority: res.data.task.priority,
          dueDate: res.data.task.dueDate ? res.data.task.dueDate.split('T')[0] : '',
          assignee: res.data.task.assignee?._id || ''
        })
      })
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTask() }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/tasks/${id}`, form)
      toast.success('Task updated')
      setEditing(false)
      fetchTask()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/tasks/${id}`, { status })
      setTask(t => ({ ...t, status }))
      setForm(f => ({ ...f, status }))
      toast.success(`Status → ${status}`)
    } catch { toast.error('Failed to update status') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      await api.post(`/tasks/${id}/comments`, { text: comment })
      setComment('')
      fetchTask()
    } catch { toast.error('Failed to add comment') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      toast.success('Task deleted')
      navigate(-1)
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!task) return <div className="p-6 text-slate-400">Task not found.</div>

  const STATUS_COLORS = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', review: 'badge-review', done: 'badge-done' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 mb-4 inline-block">← Back</button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title + actions */}
          <div className="card p-5">
            {editing ? (
              <div className="space-y-3">
                <input className="input text-lg font-semibold bg-slate-700" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                <textarea className="input resize-none h-24 text-sm" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description..." />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-lg font-semibold text-slate-100 flex-1 mr-3">{task.title}</h1>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(true)} className="btn-secondary text-xs">Edit</button>
                    <button onClick={handleDelete} className="btn-danger text-xs">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{task.description || 'No description provided.'}</p>
              </div>
            )}
          </div>

          {/* Status quick change */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium mb-3">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${task.status === s ? `${STATUS_COLORS[s]} ring-1 ring-current` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Comments ({task.comments?.length || 0})</h3>
            <div className="space-y-3 mb-4">
              {task.comments?.length === 0 ? (
                <p className="text-slate-500 text-sm">No comments yet.</p>
              ) : task.comments?.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {c.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-300">{c.user?.name}</span>
                      <span className="text-xs text-slate-600">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-slate-400">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input className="input flex-1" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
              <button type="submit" className="btn-primary px-4" disabled={saving || !comment.trim()}>Post</button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Priority</label>
              {editing ? (
                <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <span className={`badge-${task.priority} inline-flex px-2 py-1 rounded text-xs font-medium`}>{task.priority}</span>
              )}
            </div>
            <div>
              <label className="label">Assignee</label>
              <div className="text-sm text-slate-300">{task.assignee?.name || 'Unassigned'}</div>
            </div>
            <div>
              <label className="label">Project</label>
              <Link to={`/projects/${task.project?._id}`} className="text-sm text-primary-400 hover:text-primary-300">{task.project?.name}</Link>
            </div>
            <div>
              <label className="label">Created by</label>
              <div className="text-sm text-slate-300">{task.createdBy?.name}</div>
            </div>
            {task.dueDate && (
              <div>
                <label className="label">Due date</label>
                <div className={`text-sm ${task.isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {task.isOverdue && ' · Overdue'}
                </div>
              </div>
            )}
            <div>
              <label className="label">Created</label>
              <div className="text-sm text-slate-500">{format(new Date(task.createdAt), 'MMM d, yyyy')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
