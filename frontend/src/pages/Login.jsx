import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">T</div>
          <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your TaskFlow account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              No account?{' '}
              <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo creds */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-500 text-center mb-2 font-medium">Quick demo</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ email: 'admin@demo.com', password: 'password123' })}
                className="flex-1 text-xs py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'member@demo.com', password: 'password123' })}
                className="flex-1 text-xs py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              >
                Member
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
