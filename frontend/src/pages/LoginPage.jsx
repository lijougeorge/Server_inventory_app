import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = new URLSearchParams({ username: form.username, password: form.password })
      const { data } = await api.post('/auth/login', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      login(data.user, data.access_token)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'white', fontWeight: 700, marginBottom: 16
          }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>ServerHub</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sign in to your inventory</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text" placeholder="admin"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, padding: '10px' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 16 }}>
          Default credentials: admin / Admin@1234
        </p>
      </div>
    </div>
  )
}
