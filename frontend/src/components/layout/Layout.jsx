import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

const navItems = [
  { to: '/dashboard', icon: '▦', label: 'Dashboard' },
  { to: '/servers',   icon: '⬡', label: 'Servers' },
  { to: '/reports',   icon: '↓', label: 'Reports & Export' },
]
const adminItems = [
  { to: '/users',         icon: '⊙', label: 'Users' },
  { to: '/custom-fields', icon: '⊕', label: 'Custom Fields' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '0'
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'white', fontWeight: 700
            }}>S</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>ServerHub</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Inventory Manager</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px 4px' }}>Main</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius)',
              color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'var(--bg3)' : 'transparent',
              marginBottom: 2, textDecoration: 'none', fontSize: 14, transition: 'all 0.1s'
            })}>
              <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '16px 12px 4px' }}>Admin</div>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius)',
                  color: isActive ? 'var(--text)' : 'var(--text2)',
                  background: isActive ? 'var(--bg3)' : 'transparent',
                  marginBottom: 2, textDecoration: 'none', fontSize: 14, transition: 'all 0.1s'
                })}>
                  <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--accent)'
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="btn-secondary" style={{ width: '100%', fontSize: 12 }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
