import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import ServerForm from '../components/servers/ServerForm.jsx'
import ImportModal from '../components/servers/ImportModal.jsx'
import ServerDetail from '../components/servers/ServerDetail.jsx'
import toast from 'react-hot-toast'

const EMPTY = { search:'', os_name:'', environment:'', platform:'', status:'', criticality:'', crowdstrike:'', onboarded_defender:'', location:'', owner_team:'', subscription:'', customer_name:'', page:1, page_size:25 }

export default function ServersPage() {
  const [searchParams] = useSearchParams()
  const [servers, setServers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => {
    const f = { ...EMPTY }
    for (const [k,v] of searchParams.entries()) { if (k in EMPTY) f[k] = v }
    return f
  })
  const [opts, setOpts] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editServer, setEditServer] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [actionMenu, setActionMenu] = useState(false)
  const actionMenuRef = useRef()
  const { canEdit, isAdmin } = useAuth()

  const fetchServers = useCallback(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '' && v !== null))
    api.get('/servers/', { params })
      .then(r => { setServers(r.data.items); setTotal(r.data.total); setSelected(new Set()) })
      .catch(() => toast.error('Failed to load servers'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { fetchServers() }, [fetchServers])
  useEffect(() => { api.get('/servers/meta/filters').then(r => setOpts(r.data)).catch(() => {}) }, [])

  // Close action menu on outside click
  useEffect(() => {
    const handler = e => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setActionMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v, page:1 }))

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const toggleAll = () => {
    if (selected.size === servers.length) setSelected(new Set())
    else setSelected(new Set(servers.map(s => s.id)))
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this server?')) return
    try { await api.delete(`/servers/${id}`); toast.success('Deleted'); fetchServers() }
    catch { toast.error('Delete failed') }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} selected server(s)? This cannot be undone.`)) return
    try {
      await api.delete('/servers/bulk/delete', { data: Array.from(selected) })
      toast.success(`${selected.size} servers deleted`)
      fetchServers()
    } catch { toast.error('Bulk delete failed') }
    setActionMenu(false)
  }

  const handleBulkEdit = () => {
    if (selected.size !== 1) { toast.error('Select exactly one server to edit'); return }
    const s = servers.find(s => selected.has(s.id))
    setEditServer(s); setShowForm(true); setActionMenu(false)
  }

  const handleBulkCopy = () => {
    if (selected.size !== 1) { toast.error('Select exactly one server to copy'); return }
    const s = servers.find(s => selected.has(s.id))
    const copy = { ...s, id: undefined, hostname: s.hostname + '-copy', name: (s.name||s.hostname) + ' (copy)', sl: null }
    setEditServer(copy); setShowForm(true); setActionMenu(false)
  }

  const handleExportSelected = async () => {
    const hostnames = servers.filter(s => selected.has(s.id)).map(s => s.hostname).join('\n')
    navigator.clipboard.writeText(hostnames)
    toast.success(`${selected.size} hostnames copied to clipboard`)
    setActionMenu(false)
  }

  const totalPages = Math.ceil(total / filters.page_size)
  const activeFilters = Object.entries(filters).filter(([k,v]) => v !== '' && v !== null && !['page','page_size'].includes(k))

  const statusCls = s => {
    const v = (s||'').toLowerCase()
    if (v==='active') return 'badge-active'
    if (v.includes('decommission')) return 'badge-decommissioned'
    return 'badge-maintenance'
  }

  const critColor = c => {
    const v = (c||'').toLowerCase()
    if (v==='critical') return '#f87171'
    if (v==='high') return '#fcd34d'
    if (v==='medium') return '#6ee7b7'
    return 'var(--text2)'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Servers</h1>
          <p className="page-sub">{total} servers{selected.size > 0 ? ` — ${selected.size} selected` : ''}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {/* Bulk action menu */}
          {selected.size > 0 && (
            <div style={{ position:'relative' }} ref={actionMenuRef}>
              <button className="btn-secondary" onClick={() => setActionMenu(v => !v)}
                style={{ display:'flex', alignItems:'center', gap:6 }}>
                Actions ({selected.size}) <span style={{ fontSize:10 }}>▼</span>
              </button>
              {actionMenu && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50,
                  background:'var(--bg2)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)', minWidth:200, boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
                  overflow:'hidden'
                }}>
                  {[
                    { label:'Edit', icon:'✎', action: handleBulkEdit, show: canEdit, note:'1 server only' },
                    { label:'Copy / Duplicate', icon:'⧉', action: handleBulkCopy, show: canEdit, note:'1 server only' },
                    { label:'Copy hostnames', icon:'⊡', action: handleExportSelected, show: true },
                    { label:'Delete selected', icon:'✕', action: handleBulkDelete, show: isAdmin, danger: true },
                  ].filter(a => a.show).map(a => (
                    <button key={a.label} onClick={a.action} style={{
                      display:'flex', alignItems:'center', gap:10, width:'100%',
                      padding:'10px 14px', background:'transparent', border:'none',
                      color: a.danger ? 'var(--danger)' : 'var(--text)',
                      textAlign:'left', cursor:'pointer', fontSize:13,
                      borderBottom:'1px solid var(--border)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <span style={{ width:18, textAlign:'center' }}>{a.icon}</span>
                      <span style={{ flex:1 }}>{a.label}</span>
                      {a.note && <span style={{ fontSize:10, color:'var(--text3)' }}>{a.note}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {canEdit && <>
            <button className="btn-secondary" onClick={() => setShowImport(true)}>⬆ Import Excel</button>
            <button className="btn-primary" onClick={() => { setEditServer(null); setShowForm(true) }}>+ Add server</button>
          </>}
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text3)' }}>Filters:</span>
          {activeFilters.map(([k,v]) => (
            <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--bg3)', border:'1px solid var(--accent)', borderRadius:20, padding:'3px 10px', fontSize:12, color:'var(--accent)' }}>
              {k.replace(/_/g,' ')}: <strong>{v}</strong>
              <span onClick={() => set(k,'')} style={{ cursor:'pointer', color:'var(--text3)', fontWeight:700 }}>×</span>
            </span>
          ))}
          <button className="btn-secondary btn-sm" onClick={() => setFilters(EMPTY)}>Clear all</button>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <input style={{ maxWidth:190 }} placeholder="Search…" value={filters.search} onChange={e => set('search', e.target.value)} />
        <select style={{ maxWidth:150 }} value={filters.customer_name} onChange={e => set('customer_name', e.target.value)}>
          <option value="">All Customers</option>
          {opts.customer_names?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:120 }} value={filters.os_name} onChange={e => set('os_name', e.target.value)}>
          <option value="">All OS</option>
          {opts.os_names?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:110 }} value={filters.environment} onChange={e => set('environment', e.target.value)}>
          <option value="">All ENV</option>
          {opts.environments?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:130 }} value={filters.platform} onChange={e => set('platform', e.target.value)}>
          <option value="">All Platforms</option>
          {opts.platforms?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:120 }} value={filters.criticality} onChange={e => set('criticality', e.target.value)}>
          <option value="">All Criticality</option>
          {opts.criticalities?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:140 }} value={filters.crowdstrike} onChange={e => set('crowdstrike', e.target.value)}>
          <option value="">CrowdStrike: All</option>
          {opts.crowdstrike_vals?.map(o => <option key={o}>{o}</option>)}
        </select>
        <select style={{ maxWidth:130 }} value={filters.status} onChange={e => set('status', e.target.value)}>
          <option value="">All Status</option>
          {opts.statuses?.map(o => <option key={o}>{o}</option>)}
        </select>
        {activeFilters.length === 0 && <button className="btn-secondary btn-sm" onClick={() => setFilters(EMPTY)}>Clear</button>}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width:36 }}>
                  <input type="checkbox" checked={servers.length > 0 && selected.size === servers.length}
                    ref={el => { if(el) el.indeterminate = selected.size > 0 && selected.size < servers.length }}
                    onChange={toggleAll} style={{ width:'auto', cursor:'pointer' }} />
                </th>
                <th>SL</th>
                <th>Customer</th>
                <th>Name / Hostname</th>
                <th>Private IP</th>
                <th>Business App</th>
                <th>OS</th>
                <th>ENV</th>
                <th>Platform</th>
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
              ) : servers.map(s => {
                const isSelected = selected.has(s.id)
                return (
                  <tr key={s.id} style={{ background: isSelected ? 'rgba(59,130,246,0.08)' : undefined }}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)}
                        style={{ width:'auto', cursor:'pointer' }} />
                    </td>
                    <td style={{ color:'var(--text3)', fontSize:12 }}>{s.sl||''}</td>
                    <td style={{ fontSize:12, color:'var(--text2)' }}>{s.customer_name||'—'}</td>
                    <td>
                      <div onClick={() => setDetailId(s.id)} style={{ cursor:'pointer' }}>
                        <div style={{ fontWeight:500, fontSize:13, color:'var(--accent)', textDecoration:'underline', textDecorationColor:'transparent', transition:'text-decoration-color 0.15s' }}
                          onMouseEnter={e => e.target.style.textDecorationColor='var(--accent)'}
                          onMouseLeave={e => e.target.style.textDecorationColor='transparent'}>
                          {s.name||s.hostname}
                        </div>
                        {s.name && s.hostname !== s.name && <div className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{s.hostname}</div>}
                      </div>
                    </td>
                    <td><span className="mono" style={{ fontSize:12, color:'var(--text2)' }}>{s.private_ip||'—'}</span></td>
                    <td style={{ fontSize:12, color:'var(--text2)' }}>{s.business_app||'—'}</td>
                    <td style={{ fontSize:13 }}>{s.os_name} {s.os_version}</td>
                    <td style={{ fontSize:12 }}>{s.environment||'—'}</td>
                    <td style={{ fontSize:12, color:'var(--text2)' }}>{s.platform||'—'}</td>
                    <td style={{ fontSize:12 }}>
                      <div>{s.owner||'—'}</div>
                      {s.owner_team && <div style={{ fontSize:11, color:'var(--text3)' }}>{s.owner_team}</div>}
                    </td>
                    <td><span style={{ color:critColor(s.criticality), fontWeight:['critical','high'].includes((s.criticality||'').toLowerCase())?600:400, fontSize:13 }}>{s.criticality||'—'}</span></td>
                    <td style={{ fontSize:12 }}>
                      <span style={{ color: s.onboarded_defender==='Yes'?'var(--success)':'var(--text3)' }}>{s.onboarded_defender||'—'}</span>
                    </td>
                    <td style={{ fontSize:12 }}>
                      <span style={{ color:(s.crowdstrike||'').toLowerCase().includes('install')?'var(--success)':'var(--text3)' }}>{s.crowdstrike||'—'}</span>
                    </td>
                    <td><span className={`badge ${statusCls(s.status)}`}>{s.status||'—'}</span></td>
                    {canEdit && (
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn-secondary btn-sm" onClick={() => { setEditServer(s); setShowForm(true) }}>Edit</button>
                          {isAdmin && <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Del</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
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

      {detailId && <ServerDetail serverId={detailId} onClose={() => setDetailId(null)} onEdit={s => { setDetailId(null); setEditServer(s); setShowForm(true) }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchServers} />}
      {showForm && <ServerForm server={editServer} onClose={() => { setShowForm(false); setEditServer(null) }} onSaved={fetchServers} />}
    </div>
  )
}
