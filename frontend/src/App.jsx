import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Layout from './components/layout/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ServersPage from './pages/ServersPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import CustomFieldsPage from './pages/CustomFieldsPage.jsx'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e2535', color: '#e8eaf0', border: '1px solid #2a3347' }
      }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
            <Route path="custom-fields" element={<AdminOnly><CustomFieldsPage /></AdminOnly>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
