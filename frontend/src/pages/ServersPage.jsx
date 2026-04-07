import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import ServerForm from '../components/servers/ServerForm.jsx'
import ImportModal from '../components/servers/ImportModal.jsx'
import ServerDetail from '../components/servers/ServerDetail.jsx'
import toast from 'react-hot-toast'

const EMPTY = { search:'', os_name:'', environment:'', platform:'', status:'', criticality:'', crowdstrike:'', onboarded_defender:'', location:'', owner_team:'', subscription:'', page:1, page_size:25 }

export default function ServersPage() {
  const [searchParams] = useSearchParams()
  const [servers, setServers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => {
    const f = { ...EMPTY }
    for (const [k, v] of searchParams.entries()) {
      if (k in EMPTY) f[k] = v
    }
    return f
  })
  const [opts, setOpts] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editServer, setEditServer] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const { canEdit, isAdmin } = useAuth()

  const fetchServers = useCallback(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '' && v !== null))
    api.get('/servers/', { params })
      .then(r => { setServers(r.data.items); setTotal(r.data.total) })
      .catch(() => toast.error('Failed to load servers'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { fetchServers() }, [fetchServers])
  useEffect(() => { api.get('/servers/meta/filters').then(r => setOpts(r.data)).catch(() => {}) }, [])

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }))

  const handleDelete = async id => {
    if (!window.confirm('Delete this server?')) return
    try { await api.delete(`/servers/${id}`); toast.success('Deleted'); fetchServers() }
    catch { toast.error('Delete failed') }
  }

  const totalPages = Math.ceil(total / filters.page_size)

  const statusCls = s => {
    const v = (s || '').toLowerCase()
    if (v === 'active') return 'badge-active'
    if (v.includes('decommission')) return 'badge-decommissioned'
    return 'badge-maintenance'
  }

  const critColor = c => {
    const v = (c || '').toLowerCase()
    if (v === 'critical') return '#f87171'
    if (v === 'high') return '#fcd34d'
    if (v === 'medium') return '#6ee7b7'
    return 'var(--text2)'
  }

  const activeFilters = Object.entries(filters).filter(([k,v]) => v !== '' && v !== null && k !== 'page' && k !== 'page_size')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Servers</h1>
          <p className="page-sub">{total} servers{activeFilters.length > 0 ? ` — filtered by ${activeFilters.map(([k,v])=>`${k}: ${v}`).join(', ')}` : ''}</p>
        </div>
        {canEdit && (
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-secondary" onClick={() => setShowImport(true)}>⬆ Import Excel</button>
            <button className="btn-primary" onClick={() => { setEditServer(null); setShowForm(true) }}>+ Add server</button>
          </div>
        )}
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text3)' }}>Active filters:</span>
          {activeFilters.map(([k,v]) => (
            <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--bg3)', border:'1px solid var(--accent)', borderRadius:20, padding:'3px 10px', fontSize:12, color:'var(--accent)' }}>
              {k.replace(/_/g,' ')}: <strong>{v}</strong>
              <span onClick={() => set(k, '')} style={{ cursor:'pointer', color:'var(--text3)', fontWeight:700 }}>×</span>
            </span>
          ))}
          <button className="btn-secondary btn-sm" onClick={() => setFilters(EMPTY)}>Clear all</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <input style={{ maxWidth:200 }} placeholder="Search name, IP, hostname…" value={filters.search} onChange={e => set('search', e.target.value)} />
        <select style={{ maxWidth:130 }} value={filters.os_name} onChange={e => set('os_name', e.target.value)}>
          <option value="">All OS</option>
          {opts.os_names?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:120 }} value={filters.environment} onChange={e => set('environment', e.target.value)}>
          <option value="">All ENV</option>
          {opts.environments?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:140 }} value={filters.platform} onChange={e => set('platform', e.target.value)}>
          <option value="">All Platforms</option>
          {opts.platforms?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:130 }} value={filters.criticality} onChange={e => set('criticality', e.target.value)}>
          <option value="">All Criticality</option>
          {opts.criticalities?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:150 }} value={filters.crowdstrike} onChange={e => set('crowdstrike', e.target.value)}>
          <option value="">CrowdStrike: All</option>
          {opts.crowdstrike_vals?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:140 }} value={filters.onboarded_defender} onChange={e => set('onboarded_defender', e.target.value)}>
          <option value="">Defender: All</option>
          {opts.defender_vals?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:130 }} value={filters.status} onChange={e => set('status', e.target.value)}>
          <option value="">All Status</option>
          {opts.statuses?.map(o => <option key={o}>{o}</option>)}
        </select>
        {activeFilters.length === 0 && (
          <button className="btn-secondary btn-sm" onClick={() => setFilters(EMPTY)}>Clear</button>
        )}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Name / Hostname</th>
                <th>Private IP</th>
                <th>Business App</th>
                <th>OS</th>
                <th>Type</th>
                <th>ENV</th>
                <th>Platform</th>
                <th>Subscription</th>
                <th>Owner</th>
                <th>Criticality</th>
                <th>Defender</th>
                <th>CrowdStrike</th>
                <th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} style={{ textAlign:'center', color:'var(--text3)', padding:40 }}>Loading…</td></tr>
              ) : servers.length === 0 ? (
                <tr><td colSpan={15} style={{ textAlign:'center', color:'var(--text3)', padding:40 }}>No servers found</td></tr>
              ) : servers.map(s => (
                <tr key={s.id}>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{s.sl || ''}</td>
                  <td>
                    <div onClick={() => setDetailId(s.id)} style={{ cursor:'pointer' }}>
                      <div style={{ fontWeight:500, fontSize:13, color:'var(--accent)', textDecoration:'underline', textDecorationColor:'transparent', transition:'text-decoration-color 0.15s' }}
                        onMouseEnter={e => e.target.style.textDecorationColor='var(--accent)'}
                        onMouseLeave={e => e.target.style.textDecorationColor='transparent'}>
                        {s.name || s.hostname}
                      </div>
                      {s.name && s.hostname !== s.name && (
                        <div className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{s.hostname}</div>
                      )}
                    </div>
                  </td>
                  <td><span className="mono" style={{ fontSize:12, color:'var(--text2)' }}>{s.private_ip || '—'}</span></td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>{s.business_app || '—'}</td>
                  <td style={{ fontSize:13 }}>{s.os_name} {s.os_version}</td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>{s.server_type || '—'}</td>
                  <td style={{ fontSize:12 }}>{s.environment || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>{s.platform || '—'}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{s.subscription || '—'}</td>
                  <td style={{ fontSize:12 }}>
                    <div>{s.owner || '—'}</div>
                    {s.owner_team && <div style={{ fontSize:11, color:'var(--text3)' }}>{s.owner_team}</div>}
                  </td>
                  <td><span style={{ color:critColor(s.criticality), fontWeight:['critical','high'].includes((s.criticality||'').toLowerCase())?600:400, fontSize:13 }}>{s.criticality || '—'}</span></td>
                  <td style={{ fontSize:12 }}>
                    <span style={{ color: s.onboarded_defender === 'Yes' ? 'var(--success)' : 'var(--text3)' }}>{s.onboarded_defender || '—'}</span>
                  </td>
                  <td style={{ fontSize:12 }}>
                    <span style={{ color:(s.crowdstrike||'').toLowerCase().includes('install') ? 'var(--success)' : 'var(--text3)' }}>{s.crowdstrike || '—'}</span>
                  </td>
                  <td><span className={`badge ${statusCls(s.status)}`}>{s.status || '—'}</span></td>
                  {canEdit && (
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-secondary btn-sm" onClick={() => { setEditServer(s); setShowForm(true) }}>Edit</button>
                        {isAdmin && <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Del</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>Page {filters.page} of {totalPages} ({total} total)</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-secondary btn-sm" disabled={filters.page<=1} onClick={() => setFilters(f=>({...f, page:f.page-1}))}>← Prev</button>
              <button className="btn-secondary btn-sm" disabled={filters.page>=totalPages} onClick={() => setFilters(f=>({...f, page:f.page+1}))}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {detailId && (
        <ServerDetail
          serverId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={s => { setDetailId(null); setEditServer(s); setShowForm(true) }}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchServers} />}
      {showForm && <ServerForm server={editServer} onClose={() => { setShowForm(false); setEditServer(null) }} onSaved={fetchServers} />}
    </div>
  )
}
