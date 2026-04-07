import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

const EMPTY = { search:'', os_name:'', environment:'', platform:'', status:'', criticality:'', crowdstrike:'', onboarded_defender:'', location:'', owner_team:'', subscription:'' }

export default function ReportsPage() {
  const [filters, setFilters] = useState(EMPTY)
  const [opts, setOpts] = useState({})
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => { api.get('/servers/meta/filters').then(r => setOpts(r.data)).catch(() => {}) }, [])

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const activeParams = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))
  const activeCount = Object.values(filters).filter(v => v !== '').length

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const r = await api.get('/servers/', { params: { ...activeParams, page:1, page_size:10 } })
      setPreview(r.data)
    } catch { toast.error('Failed to load preview') }
    finally { setPreviewLoading(false) }
  }

  const doExport = async fmt => {
    setExporting(fmt)
    try {
      const r = await api.get(`/export/${fmt}`, { params: activeParams, responseType:'blob' })
      const ext = fmt === 'excel' ? 'xlsx' : fmt
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `server_inventory_${new Date().toISOString().slice(0,10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${fmt.toUpperCase()} exported!`)
    } catch { toast.error('Export failed') }
    finally { setExporting('') }
  }

  const statusStyle = s => {
    const v = (s||'').toLowerCase()
    if (v==='active') return 'badge-active'
    if (v.includes('decommission')) return 'badge-decommissioned'
    return 'badge-maintenance'
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Reports & Export</h1><p className="page-sub">Filter → Preview → Export</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:24 }}>
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:16, fontSize:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Filters</span>
              {activeCount > 0 && <span style={{ fontSize:11, background:'var(--accent)', color:'white', borderRadius:20, padding:'2px 8px' }}>{activeCount} active</span>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['search',            'Search', 'input',  'Name, hostname, IP…'],
                ['os_name',           'OS',     'select', 'os_names'],
                ['environment',       'ENV',    'select', 'environments'],
                ['platform',          'Platform','select','platforms'],
                ['criticality',       'Criticality','select','criticalities'],
                ['status',            'Status', 'select', 'statuses'],
                ['crowdstrike',       'CrowdStrike','select','crowdstrike_vals'],
                ['onboarded_defender','Defender','select','defender_vals'],
                ['subscription',      'Subscription','select','subscriptions'],
                ['location',          'Location','select','locations'],
                ['owner_team',        'Owner Team','select','owner_teams'],
              ].map(([key, label, type, optsKey]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  {type === 'input'
                    ? <input placeholder={optsKey} value={filters[key]} onChange={e => set(key, e.target.value)} />
                    : <select value={filters[key]} onChange={e => set(key, e.target.value)}>
                        <option value="">All</option>
                        {opts[optsKey]?.map(o => <option key={o}>{o}</option>)}
                      </select>
                  }
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button className="btn-secondary btn-sm" onClick={() => { setFilters(EMPTY); setPreview(null) }} style={{ flex:1 }}>Clear</button>
                <button className="btn-primary btn-sm" onClick={loadPreview} disabled={previewLoading} style={{ flex:2 }}>
                  {previewLoading ? 'Loading…' : 'Preview results'}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Export</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { fmt:'excel', label:'Excel (.xlsx)', desc:'Coloured rows, filters, all columns', icon:'⊞' },
                { fmt:'csv',   label:'CSV (.csv)',    desc:'Universal, all columns',              icon:'⊟' },
                { fmt:'pdf',   label:'PDF report',    desc:'Formatted report, landscape A3',      icon:'⊠' },
              ].map(({ fmt, label, desc, icon }) => (
                <button key={fmt} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:12, textAlign:'left', padding:'10px 14px' }}
                  onClick={() => doExport(fmt)} disabled={!!exporting}>
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{exporting===fmt ? 'Exporting…' : label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:600, fontSize:14 }}>Preview {preview ? `(${preview.total} servers match)` : ''}</span>
            {preview && <span style={{ fontSize:12, color:'var(--text3)' }}>Showing first 10 of {preview.total}</span>}
          </div>
          {!preview ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⊡</div>
              <div style={{ fontSize:14 }}>Set filters and click "Preview results"</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr><th>SL</th><th>Name</th><th>Hostname</th><th>Private IP</th><th>OS</th><th>ENV</th><th>Platform</th><th>Owner</th><th>Criticality</th><th>CrowdStrike</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {preview.items.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize:12, color:'var(--text3)' }}>{s.sl}</td>
                      <td style={{ fontSize:13 }}>{s.name || s.hostname}</td>
                      <td className="mono" style={{ fontSize:11, color:'var(--text2)' }}>{s.hostname}</td>
                      <td className="mono" style={{ fontSize:11, color:'var(--text2)' }}>{s.private_ip}</td>
                      <td style={{ fontSize:12 }}>{s.os_name} {s.os_version}</td>
                      <td style={{ fontSize:12 }}>{s.environment}</td>
                      <td style={{ fontSize:12, color:'var(--text2)' }}>{s.platform}</td>
                      <td style={{ fontSize:12 }}>{s.owner}</td>
                      <td style={{ fontSize:12, color: (s.criticality||'').toLowerCase()==='critical'?'#f87171':'var(--text2)' }}>{s.criticality}</td>
                      <td style={{ fontSize:12, color: (s.crowdstrike||'').toLowerCase().includes('install')?'var(--success)':'var(--text3)' }}>{s.crowdstrike}</td>
                      <td><span className={`badge ${statusStyle(s.status)}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
