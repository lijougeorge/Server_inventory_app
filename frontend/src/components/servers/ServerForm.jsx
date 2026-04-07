import { useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'

const YES_NO = ['Yes', 'No']
const ENVS   = ['Prod', 'Dev', 'Staging', 'DR', 'Test', 'UAT']
const TYPES  = ['App Server', 'DB Server', 'Web Server', 'File Server', 'Proxy', 'DNS', 'Mail Server', 'Monitoring', 'Other']
const CRITS  = ['Critical', 'High', 'Medium', 'Low']
const PLATFORMS = ['B Cloud', 'Azure', 'AWS', 'GCP', 'On-Prem', 'VMware', 'Hyper-V', 'Other']
const OS_NAMES  = ['RHEL', 'Ubuntu', 'CentOS', 'Debian', 'Windows Server', 'Rocky Linux', 'AlmaLinux', 'SUSE', 'Other']
const STATUSES  = ['Active', 'Inactive', 'To Be Decommissioned', 'Decommissioned', 'Maintenance']
const CS_VALS   = ['Installed', 'Not Installed', 'Pending']

const EMPTY = {
  sl:'', name:'', private_ip:'', business_app:'', hostname:'', os_name:'', os_version:'',
  server_type:'', environment:'', platform:'', ops_manager:'', azure_update_schedule:'',
  onboarded_defender:'', onboarded_pam:'', ipa_integration:'', msb_compliance:'',
  subscription:'', location:'', resource_group:'', owner:'', owner_team:'', criticality:'',
  support_suma:'', support_dcentral:'', dcentral:'', crowdstrike:'', status:'Active', notes:'', custom_data:{}
}

function S({ title }) {
  return <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'20px 0 10px', paddingBottom:6, borderBottom:'1px solid var(--border)' }}>{title}</div>
}
function F({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>
}

export default function ServerForm({ server, onClose, onSaved }) {
  const isEdit = !!server?.id
  const [form, setForm] = useState({ ...EMPTY, ...(server || {}) })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, sl: form.sl ? parseInt(form.sl) : null }
      if (isEdit) await api.put(`/servers/${server.id}`, payload)
      else await api.post('/servers/', payload)
      toast.success(isEdit ? 'Server updated' : 'Server added')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving')
    } finally { setLoading(false) }
  }

  const sel = (k, opts, placeholder) => (
    <select value={form[k]} onChange={e => set(k, e.target.value)}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? `Edit: ${server.hostname}` : 'Add new server'}</div>
        <form onSubmit={handleSubmit}>

          <S title="Identity" />
          <div className="form-row-3">
            <F label="SL"><input type="number" value={form.sl} onChange={e => set('sl', e.target.value)} placeholder="1" /></F>
            <F label="Name"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ecs-ipar-s201" /></F>
            <F label="Hostname *"><input value={form.hostname} onChange={e => set('hostname', e.target.value)} required placeholder="ecs-ipar-s201" /></F>
          </div>
          <div className="form-row" style={{ marginTop:12 }}>
            <F label="Private IP Address"><input value={form.private_ip} onChange={e => set('private_ip', e.target.value)} placeholder="10.201.10.200" /></F>
            <F label="Business App / System"><input value={form.business_app} onChange={e => set('business_app', e.target.value)} placeholder="FreeIPA" /></F>
          </div>

          <S title="Operating System" />
          <div className="form-row-3">
            <F label="OS *">{sel('os_name', OS_NAMES, 'Select OS')}</F>
            <F label="Version *"><input value={form.os_version} onChange={e => set('os_version', e.target.value)} placeholder="8.10" required /></F>
            <F label="Type">{sel('server_type', TYPES, 'Select type')}</F>
          </div>

          <S title="Environment & Platform" />
          <div className="form-row-3">
            <F label="ENV">{sel('environment', ENVS, 'Select env')}</F>
            <F label="Platform">{sel('platform', PLATFORMS, 'Select platform')}</F>
            <F label="Status">{sel('status', STATUSES, 'Select status')}</F>
          </div>

          <S title="Cloud / Infrastructure" />
          <div className="form-row-3">
            <F label="Subscription"><input value={form.subscription} onChange={e => set('subscription', e.target.value)} placeholder="ae-ad-1" /></F>
            <F label="Location"><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="UAE North" /></F>
            <F label="Resource Group"><input value={form.resource_group} onChange={e => set('resource_group', e.target.value)} placeholder="rg-prod-01" /></F>
          </div>
          <div className="form-row" style={{ marginTop:12 }}>
            <F label="OpsManager"><input value={form.ops_manager} onChange={e => set('ops_manager', e.target.value)} placeholder="ops-manager hostname" /></F>
            <F label="Azure UpdateManager Schedule"><input value={form.azure_update_schedule} onChange={e => set('azure_update_schedule', e.target.value)} placeholder="Weekly-Sunday-2AM" /></F>
          </div>

          <S title="Ownership" />
          <div className="form-row-3">
            <F label="Owner"><input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Mohammed Zubair" /></F>
            <F label="Owner Team"><input value={form.owner_team} onChange={e => set('owner_team', e.target.value)} placeholder="Infrastructure" /></F>
            <F label="Criticality">{sel('criticality', CRITS, 'Select criticality')}</F>
          </div>

          <S title="Compliance & Security" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <F label="Onboarded to Defender">{sel('onboarded_defender', YES_NO, 'Select')}</F>
            <F label="Onboarded PAM"><input value={form.onboarded_pam} onChange={e => set('onboarded_pam', e.target.value)} placeholder="Yes / No / FALSE" /></F>
            <F label="IPA Integration"><input value={form.ipa_integration} onChange={e => set('ipa_integration', e.target.value)} placeholder="Yes / To Be Decommissioned" /></F>
            <F label="MSB Compliance"><input value={form.msb_compliance} onChange={e => set('msb_compliance', e.target.value)} placeholder="Compliant" /></F>
            <F label="CrowdStrike">{sel('crowdstrike', CS_VALS, 'Select')}</F>
            <F label="Support SUMA">{sel('support_suma', YES_NO, 'Select')}</F>
          </div>
          <div className="form-row" style={{ marginTop:12 }}>
            <F label="Support DCentral">{sel('support_dcentral', YES_NO, 'Select')}</F>
            <F label="DCentral"><input value={form.dcentral} onChange={e => set('dcentral', e.target.value)} placeholder="Yes / No" /></F>
          </div>

          <S title="Notes" />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional notes…" />

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
