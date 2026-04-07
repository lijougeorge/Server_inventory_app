import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

const ROLES = ['viewer', 'editor', 'admin']
const EMPTY_FORM = { username: '', email: '', full_name: '', password: '', role: 'viewer' }

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id
  const [form, setForm] = useState(isEdit ? { ...user, password: '' } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form }
      if (isEdit && !payload.password) delete payload.password
      if (isEdit) await api.put(`/users/${user.id}`, payload)
      else await api.post('/users/', payload)
      toast.success(isEdit ? 'User updated' : 'User created')
      onSaved(); onClose()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-title">{isEdit ? 'Edit user' : 'Add new user'}</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-row">
            <div className="form-group"><label>Full name *</label><input value={form.full_name} onChange={e => set('full_name', e.target.value)} required /></div>
            <div className="form-group"><label>Username *</label><input value={form.username} onChange={e => set('username', e.target.value)} required disabled={isEdit} /></div>
          </div>
          <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group">
              <label>Password {isEdit ? '(leave blank to keep)' : '*'}</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required={!isEdit} placeholder={isEdit ? 'Leave blank to keep' : ''} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: 8, paddingTop: 16 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save' : 'Create user'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const fetchUsers = () => api.get('/users/').then(r => setUsers(r.data)).catch(() => toast.error('Failed to load users'))

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async u => {
    if (!window.confirm(`Delete user "${u.username}"?`)) return
    try { await api.delete(`/users/${u.id}`); toast.success('User deleted'); fetchUsers() }
    catch { toast.error('Delete failed') }
  }

  const handleToggle = async u => {
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); fetchUsers() }
    catch { toast.error('Update failed') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-sub">Manage access and roles</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }}>+ Add user</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                <td className="mono" style={{ fontSize: 13, color: 'var(--text2)' }}>{u.username}</td>
                <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-active' : 'badge-decommissioned'}`}>
                    {u.is_active ? 'active' : 'disabled'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary btn-sm" onClick={() => { setEditUser(u); setShowModal(true) }}>Edit</button>
                    <button className="btn-secondary btn-sm" onClick={() => handleToggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(u)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <UserModal user={editUser} onClose={() => { setShowModal(false); setEditUser(null) }} onSaved={fetchUsers} />}
    </div>
  )
}
