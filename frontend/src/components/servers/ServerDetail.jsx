import { useState, useEffect } from 'react'
import api from '../../utils/api.js'

function Field({ label, value, mono, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <div style={{ fontSize:11, color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
      <div style={{ fontSize:13, color: color || (value ? 'var(--text)' : 'var(--text3)'), fontFamily: mono ? 'monospace' : 'inherit', wordBreak:'break-all' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>{title}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>{children}</div>
    </div>
  )
}

function YesNo({ label, value }) {
  const v = (value || '').toLowerCase()
  const color = v === 'yes' ? 'var(--success)' : (v === 'no' || v === 'false') ? 'var(--danger)' : 'var(--text2)'
  return <Field label={label} value={value} color={color} />
}

export default function ServerDetail({ serverId, onClose, onEdit }) {
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/servers/${serverId}`)
      .then(r => setServer(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [serverId])

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

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200 }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:660,
        background:'var(--bg2)', borderLeft:'1px solid var(--border)',
        zIndex:201, overflowY:'auto', display:'flex', flexDirection:'column'
      }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', background:'var(--bg3)', flexShrink:0 }}>
          {loading ? (
            <div style={{ color:'var(--text2)' }}>Loading…</div>
          ) : server ? (
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  <span className={`badge ${statusCls(server.status)}`}>{server.status}</span>
                  {server.criticality && (
                    <span style={{ fontSize:12, fontWeight:600, color:critColor(server.criticality) }}>{server.criticality}</span>
                  )}
                  {server.environment && (
                    <span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--border)' }}>{server.environment}</span>
                  )}
                  {server.platform && (
                    <span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--border)' }}>{server.platform}</span>
                  )}
                </div>
                <div style={{ fontSize:20, fontWeight:700, fontFamily:'monospace', color:'var(--text)' }}>{server.hostname}</div>
                {server.name && server.name !== server.hostname && (
                  <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{server.name}</div>
                )}
                {server.business_app && (
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{server.business_app}</div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {onEdit && (
                  <button className="btn-secondary btn-sm" onClick={() => { onClose(); onEdit(server) }}>Edit</button>
                )}
                <button onClick={onClose} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:'var(--radius)', padding:'4px 12px', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
              </div>
            </div>
          ) : (
            <div style={{ color:'var(--danger)' }}>Server not found</div>
          )}
        </div>

        {/* Body */}
        {!loading && server && (
          <div style={{ padding:'24px', flex:1 }}>
            <Section title="Identity">
              <Field label="SL" value={server.sl} />
              <Field label="Name" value={server.name} />
              <Field label="Hostname" value={server.hostname} mono />
              <Field label="Private IP Address" value={server.private_ip} mono />
              <Field label="Business App / System" value={server.business_app} />
              <div />
            </Section>

            <Section title="Operating System">
              <Field label="OS" value={server.os_name} />
              <Field label="Version" value={server.os_version} />
              <Field label="Server Type" value={server.server_type} />
              <Field label="Environment" value={server.environment} />
            </Section>

            <Section title="Platform & Infrastructure">
              <Field label="Platform" value={server.platform} />
              <Field label="Subscription" value={server.subscription} />
              <Field label="Location" value={server.location} />
              <Field label="Resource Group" value={server.resource_group} />
              <Field label="OpsManager" value={server.ops_manager} mono />
              <Field label="Azure Update Schedule" value={server.azure_update_schedule} />
            </Section>

            <Section title="Ownership">
              <Field label="Owner" value={server.owner} />
              <Field label="Owner Team" value={server.owner_team} />
              <Field label="Criticality" value={server.criticality} color={critColor(server.criticality)} />
            </Section>

            <Section title="Compliance & Security">
              <YesNo label="Onboarded to Defender" value={server.onboarded_defender} />
              <YesNo label="Onboarded PAM" value={server.onboarded_pam} />
              <Field label="IPA Integration" value={server.ipa_integration} />
              <Field label="MSB Compliance" value={server.msb_compliance} />
              <Field label="CrowdStrike" value={server.crowdstrike}
                color={(server.crowdstrike||'').toLowerCase().includes('install') ? 'var(--success)' : undefined} />
              <YesNo label="Support SUMA" value={server.support_suma} />
              <YesNo label="Support DCentral" value={server.support_dcentral} />
              <Field label="DCentral" value={server.dcentral} />
            </Section>

            {server.notes && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>Notes</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8, background:'var(--bg3)', padding:12, borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>{server.notes}</div>
              </div>
            )}

            {server.custom_data && Object.keys(server.custom_data).length > 0 && (
              <Section title="Custom Fields">
                {Object.entries(server.custom_data).map(([k,v]) => (
                  <Field key={k} label={k.replace(/_/g,' ')} value={v} />
                ))}
              </Section>
            )}

            <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginTop:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Field label="Created At" value={server.created_at ? new Date(server.created_at).toLocaleString() : null} />
                <Field label="Last Modified" value={server.updated_at ? new Date(server.updated_at).toLocaleString() : null} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
