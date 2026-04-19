import { useState, useRef } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function ImportModal({ onClose, onImported }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('insert')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()
  const { isAdmin } = useAuth()

  const handleFile = f => {
    const name = f.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      toast.error('Only .xlsx, .xls or .csv files are supported')
      return
    }
    setFile(f); setResult(null)
  }

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post(`/import/upload?mode=${mode}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
      const count = mode === 'update' ? data.updated : data.imported
      if (count > 0) { toast.success(data.message); onImported() }
      else toast.error('No servers were processed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed')
    } finally { setLoading(false) }
  }

  const downloadTemplate = async () => {
    try {
      const r = await api.get('/import/template', { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'server_import_template.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Template downloaded!')
    } catch { toast.error('Failed to download template') }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-title">Import servers from Excel / CSV</div>

        {/* Step 1 */}
        <div style={{ marginBottom:20, padding:'14px 16px', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>Step 1 — Download template</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>
            Fill your servers using the Excel template. Required columns are highlighted.
            Your existing inventory Excel can also be uploaded directly.
          </div>
          <button className="btn-secondary btn-sm" onClick={downloadTemplate}>Download template (.xlsx)</button>
        </div>

        {/* Step 2 — Mode selection (admin only for update) */}
        {isAdmin && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Step 2 — Select import mode</div>
            <div style={{ display:'flex', gap:12 }}>
              {[
                { val:'insert', label:'Insert new servers', desc:'Add servers that do not exist. Duplicates are skipped.' },
                { val:'update', label:'Update existing servers', desc:'Match by hostname and overwrite fields. Admin only.' },
              ].map(opt => (
                <div key={opt.val} onClick={() => setMode(opt.val)} style={{
                  flex:1, padding:'12px 14px', borderRadius:'var(--radius)',
                  border:`2px solid ${mode === opt.val ? 'var(--accent)' : 'var(--border)'}`,
                  background: mode === opt.val ? 'rgba(59,130,246,0.06)' : 'var(--bg3)',
                  cursor:'pointer', transition:'all 0.15s'
                }}>
                  <div style={{ fontWeight:600, fontSize:13, color: mode === opt.val ? 'var(--accent)' : 'var(--text)', marginBottom:4 }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            {mode === 'update' && (
              <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius)', fontSize:12, color:'#fbbf24' }}>
                Update mode: matches servers by hostname and updates all non-empty fields. Empty cells in the file are ignored.
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Upload */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>{isAdmin ? 'Step 3' : 'Step 2'} — Upload your file</div>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border:`2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border)'}`,
              borderRadius:'var(--radius-lg)', padding:'32px 20px', textAlign:'center',
              cursor:'pointer', background: dragging ? 'rgba(59,130,246,0.05)' : file ? 'rgba(34,197,94,0.05)' : 'transparent',
              transition:'all 0.15s'
            }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div>
                <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
                <div style={{ fontWeight:600, color:'var(--success)' }}>{file.name}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{(file.size/1024).toFixed(1)} KB — click to change</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:32, marginBottom:8, color:'var(--text3)' }}>⬆</div>
                <div style={{ fontWeight:500, marginBottom:4 }}>Drop file here or click to browse</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>Supports .xlsx, .xls, .csv</div>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            marginBottom:20, padding:'14px 16px',
            background: (result.imported > 0 || result.updated > 0) ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border:`1px solid ${(result.imported > 0 || result.updated > 0) ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius:'var(--radius)'
          }}>
            <div style={{ fontWeight:600, marginBottom:10, color: (result.imported > 0 || result.updated > 0) ? 'var(--success)' : 'var(--danger)' }}>
              {result.mode === 'update' ? 'Update' : 'Import'} results
            </div>
            <div style={{ display:'flex', gap:20, marginBottom: result.errors?.length ? 10 : 0 }}>
              {result.mode === 'insert' && (
                <div style={{ fontSize:13 }}>
                  <span style={{ color:'var(--success)', fontWeight:700, fontSize:20 }}>{result.imported}</span>
                  <span style={{ color:'var(--text2)', marginLeft:4 }}>inserted</span>
                </div>
              )}
              {result.mode === 'update' && (
                <div style={{ fontSize:13 }}>
                  <span style={{ color:'var(--accent)', fontWeight:700, fontSize:20 }}>{result.updated}</span>
                  <span style={{ color:'var(--text2)', marginLeft:4 }}>updated</span>
                </div>
              )}
              <div style={{ fontSize:13 }}>
                <span style={{ color:'var(--warning)', fontWeight:700, fontSize:20 }}>{result.skipped}</span>
                <span style={{ color:'var(--text2)', marginLeft:4 }}>skipped</span>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div style={{ maxHeight:120, overflowY:'auto' }}>
                {result.errors.map((e,i) => (
                  <div key={i} style={{ fontSize:11, color:'var(--warning)', padding:'2px 0', fontFamily:'monospace' }}>{e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{result ? 'Close' : 'Cancel'}</button>
          {!result && (
            <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Processing…' : mode === 'update' ? `Update servers` : `Import servers`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
