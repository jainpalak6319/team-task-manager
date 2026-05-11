import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function Team() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return }
    api.get('/users')
      .then(res => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role })
      setUsers(u => u.map(user => user._id === userId ? { ...user, role } : user))
      toast.success('Role updated')
    } catch { toast.error('Failed to update role') }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-100 mb-4">Team</h1>
        <div className="card p-8 text-center">
          <p className="text-slate-400">Team management is available to admins only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-100">Team Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">{users.length} registered users</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id} className={`border-b border-slate-800/50 ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-400">
                      {u.name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-400">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u._id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
