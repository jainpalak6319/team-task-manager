import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS = {
  active: 'text-green-400 bg-green-500/10',
  completed: 'text-blue-400 bg-blue-500/10',
  'on-hold': 'text-amber-400 bg-amber-500/10',
  cancelled: 'text-red-400 bg-red-500/10'
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', deadline: '', tags: '' })
  const [saving, setSaving] = useState(false)

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/projects', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
      toast.success('Project created!')
      setShowModal(false)
      setForm({ name: '', description: '', deadline: '', tags: '' })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-lg mb-2">No projects yet</p>
          <p className="text-slate-600 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create project</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card p-5 hover:border-slate-700 transition-all duration-200 hover:bg-slate-800/30 group block">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-100 group-hover:text-primary-400 transition-colors truncate mr-2">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${STATUS_COLORS[project.status] || STATUS_COLORS.active}`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
              )}
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{project.completedCount}/{project.taskCount} tasks</span>
                  <span>{project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${project.taskCount > 0 ? (project.completedCount / project.taskCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m.user?._id} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-xs text-slate-400 font-medium" title={m.user?.name}>
                      {m.user?.name?.charAt(0)}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-xs text-slate-400">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                {project.deadline && (
                  <span className="text-xs text-slate-500">Due {format(new Date(project.deadline), 'MMM d')}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-100 mb-5">New project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Project name *</label>
                <input className="input" placeholder="My awesome project" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none h-20" placeholder="What's this project about?"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input className="input" placeholder="frontend, api, design" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
