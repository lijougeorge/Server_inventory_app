import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

const FIELD_TYPES = [
  { value: 'text',   label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date',   label: 'Date' },
  { value: 'select', label: 'Dropdown (select)' },
]

const EMPTY = { name: '', label: '', field_type: 'text', options: [], required: false }

function FieldModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [optionInput, setOptionInput] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addOption = () => {
    const val = optionInput.trim()
    if (!val || form.options.includes(val)) return
    setForm(f => ({ ...f, options: [...f.options, val] }))
    setOptionInput('')
  }

  const removeOption = opt => setForm(f => ({ ...f, options: f.options.filter(o => o !== opt) }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.match(/^[a-z0-9_]+$/)) {
      toast.error('Field key must be lowercase letters, numbers and underscores only')
      return
    }
    setLoading(true)
    try {
      await api.post('/custom-fields/', form)
      toast.success('Custom field created')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error creating field')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-title">Add custom field</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="form-row">
            <div className="form-group">
              <label>Field key *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="e.g. contract_number"
                required
              />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Lowercase, underscores only. Used internally.</span>
            </div>
            <div className="form-group">
              <label>Display label *</label>
              <input
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="e.g. Contract Number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Field type</label>
              <select value={form.field_type} onChange={e => set('field_type', e.target.value)}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 'auto' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.required}
                  onChange={e => set('required', e.target.checked)}
                />
                Required field
              </label>
            </div>
          </div>

          {form.field_type === 'select' && (
            <div className="form-group">
              <label>Dropdown options</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={optionInput}
                  onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="Type an option and press Enter or Add"
                />
                <button type="button" className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={addOption}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.options.map(o => (
                  <span key={o} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '3px 10px', fontSize: 12
                  }}>
                    {o}
                    <span onClick={() => removeOption(o)} style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}>×</span>
                  </span>
                ))}
                {form.options.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>No options yet — add at least one</span>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState([])
  const [showModal, setShowModal] = useState(false)

  const fetchFields = () => api.get('/custom-fields/').then(r => setFields(r.data)).catch(() => toast.error('Failed to load fields'))

  useEffect(() => { fetchFields() }, [])

  const handleDelete = async f => {
    if (!window.confirm(`Delete field "${f.label}"? This will remove it from all server records.`)) return
    try {
      await api.delete(`/custom-fields/${f.id}`)
      toast.success('Field deleted')
      fetchFields()
    } catch { toast.error('Delete failed') }
  }

  const typeLabels = { text: 'Text', number: 'Number', date: 'Date', select: 'Dropdown' }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Custom Fields</h1>
          <p className="page-sub">Add extra fields to every server record</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add field</button>
      </div>

      {fields.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⊕</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No custom fields yet</div>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
            Add fields like "Contract Number", "Warranty Expiry", "Support Tier", etc.
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add your first field</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Field key</th>
                <th>Display label</th>
                <th>Type</th>
                <th>Options</th>
                <th>Required</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id}>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{f.name}</td>
                  <td style={{ fontWeight: 500 }}>{f.label}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--text2)'
                    }}>
                      {typeLabels[f.field_type] || f.field_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {f.options?.length > 0 ? f.options.join(', ') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${f.required ? 'badge-maintenance' : 'badge-viewer'}`}>
                      {f.required ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(f.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(f)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>How custom fields work</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.8 }}>
          <p>Custom fields appear in the <strong style={{ color: 'var(--text)' }}>Add / Edit Server</strong> form automatically once created.</p>
          <p>They are also included in all <strong style={{ color: 'var(--text)' }}>CSV and Excel exports</strong> as extra columns.</p>
          <p>Field type <strong style={{ color: 'var(--text)' }}>Dropdown</strong> lets you define allowed values, keeping data consistent across your team.</p>
          <p style={{ color: 'var(--danger)', marginTop: 8 }}>Deleting a field removes the label definition but existing data stored on servers is not automatically cleared.</p>
        </div>
      </div>

      {showModal && <FieldModal onClose={() => setShowModal(false)} onSaved={fetchFields} />}
    </div>
  )
}
