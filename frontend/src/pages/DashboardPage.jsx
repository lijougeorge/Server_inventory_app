import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api.js'
import { useAuth } from '../hooks/useAuth.jsx'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6']

function StatCard({ label, value, color, onClick, filterKey, filterValue }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', padding:'16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition:'all 0.15s',
        borderLeft: `3px solid ${color}`,
      }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor = color; if(onClick) e.currentTarget.style.background = 'var(--bg3)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)' }}
      title={onClick ? `Click to view ${value} ${label} servers` : ''}
    >
      <div style={{ fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:500, marginTop:6, color:'var(--text)' }}>{label}</div>
      {onClick && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Click to view →</div>}
    </div>
  )
}

function ClickableBar({ data, filterKey, navigate }) {
  return data.map((entry, i) => (
    <Cell
      key={i}
      fill={COLORS[i % COLORS.length]}
      style={{ cursor:'pointer' }}
      onClick={() => navigate(`/servers?${filterKey}=${encodeURIComponent(entry.name)}`)}
    />
  ))
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/').then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--text2)' }}>
      Loading dashboard…
    </div>
  )

  const statusData    = Object.entries(data.by_status || {}).map(([name, value]) => ({ name, value }))
  const osData        = Object.entries(data.by_os || {}).map(([name, value]) => ({ name: name || 'Unknown', value }))
  const envData       = Object.entries(data.by_environment || {}).map(([name, value]) => ({ name: name || 'Unknown', value }))
  const platformData  = Object.entries(data.by_platform || {}).map(([name, value]) => ({ name: name || 'Unknown', value }))
  const critData      = Object.entries(data.by_criticality || {}).map(([name, value]) => ({ name: name || 'Unknown', value }))
  const csData        = Object.entries(data.by_crowdstrike || {}).map(([name, value]) => ({ name: name || 'Unknown', value }))

  const statusColors = {
    active: '#22c55e', inactive: '#f59e0b',
    'to be decommissioned': '#ef4444', decommissioned: '#ef4444', maintenance: '#f59e0b'
  }

  const tip = { contentStyle:{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 } }

  const goServers = (key, val) => navigate(`/servers?${key}=${encodeURIComponent(val)}`)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {user?.full_name} — click any card or chart to drill into that server list</p>
        </div>
      </div>

      {/* Top stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total Servers" value={data.total_servers} color="var(--accent)" onClick={() => navigate('/servers')} />
        {statusData.map((s, i) => (
          <StatCard
            key={s.name}
            label={s.name.charAt(0).toUpperCase() + s.name.slice(1)}
            value={s.value}
            color={statusColors[(s.name||'').toLowerCase()] || COLORS[i]}
            onClick={() => goServers('status', s.name)}
          />
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>

        {/* Status pie */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>Status</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click a slice to filter</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={"70%"} dataKey="value"
                onClick={d => goServers('status', d.name)} style={{ cursor:'pointer' }}>
                {statusData.map((d,i) => <Cell key={i} fill={statusColors[d.name.toLowerCase()] || COLORS[i]} />)}
              </Pie>
              <Tooltip {...tip} formatter={(v,n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8, justifyContent:'center' }}>
            {statusData.map((d,i) => (
              <span key={d.name} onClick={() => goServers('status', d.name)}
                style={{ fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: statusColors[d.name.toLowerCase()] || COLORS[i], display:'inline-block' }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* OS bar */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>By OS</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click a bar to filter</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={osData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize:11, fill:'var(--text2)' }} />
              <Tooltip {...tip} />
              <Bar dataKey="value" radius={[0,4,4,0]} onClick={d => goServers('os_name', d.name)} style={{ cursor:'pointer' }}>
                {osData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ENV bar */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>By Environment</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click a bar to filter</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={envData}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text2)' }} />
              <YAxis tick={{ fontSize:10, fill:'var(--text2)' }} />
              <Tooltip {...tip} />
              <Bar dataKey="value" radius={[4,4,0,0]} onClick={d => goServers('environment', d.name)} style={{ cursor:'pointer' }}>
                {envData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>

        {/* Platform */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>By Platform</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click to filter</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={platformData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize:11, fill:'var(--text2)' }} />
              <Tooltip {...tip} />
              <Bar dataKey="value" radius={[0,4,4,0]} onClick={d => goServers('platform', d.name)} style={{ cursor:'pointer' }}>
                {platformData.map((_,i) => <Cell key={i} fill={COLORS[(i+3) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Criticality */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>By Criticality</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click to filter</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={critData}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text2)' }} />
              <YAxis tick={{ fontSize:10, fill:'var(--text2)' }} />
              <Tooltip {...tip} />
              <Bar dataKey="value" radius={[4,4,0,0]} onClick={d => goServers('criticality', d.name)} style={{ cursor:'pointer' }}>
                {critData.map(d => {
                  const v = (d.name||'').toLowerCase()
                  const c = v==='critical'?'#f87171':v==='high'?'#fcd34d':v==='medium'?'#6ee7b7':'#94a3b8'
                  return <Cell key={d.name} fill={c} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CrowdStrike */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>CrowdStrike</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Click to filter</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={csData} cx="50%" cy="50%" innerRadius={40} outerRadius={"65%"} dataKey="value"
                onClick={d => goServers('crowdstrike', d.name)} style={{ cursor:'pointer' }}>
                {csData.map((d,i) => {
                  const v = (d.name||'').toLowerCase()
                  const c = v.includes('install') ? '#22c55e' : v.includes('not') ? '#ef4444' : COLORS[i]
                  return <Cell key={i} fill={c} />
                })}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {csData.map((d,i) => {
              const v = (d.name||'').toLowerCase()
              const c = v.includes('install') ? '#22c55e' : v.includes('not') ? '#ef4444' : COLORS[i]
              return (
                <span key={d.name} onClick={() => goServers('crowdstrike', d.name)}
                  style={{ fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }} />
                  {d.name} ({d.value})
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div style={{ fontWeight:600, marginBottom:16, fontSize:13 }}>Recent activity</div>
        {!data.recent_activity?.length ? (
          <div style={{ color:'var(--text3)', fontSize:13 }}>No activity yet</div>
        ) : (
          <table>
            <thead>
              <tr><th>Action</th><th>Resource</th><th>Detail</th><th>Time</th></tr>
            </thead>
            <tbody>
              {data.recent_activity.map((log, i) => (
                <tr key={i}>
                  <td>
                    <span className={`badge ${log.action==='create'?'badge-active':log.action==='delete'?'badge-decommissioned':'badge-maintenance'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color:'var(--text2)' }}>{log.resource} #{log.resource_id}</td>
                  <td style={{ color:'var(--text2)', fontFamily:'monospace', fontSize:12 }}>{log.detail?.hostname || ''}</td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
