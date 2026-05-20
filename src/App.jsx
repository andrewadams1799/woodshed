import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard   from './pages/Dashboard'
import SongPage    from './pages/SongPage'
import LoginPage   from './pages/LoginPage'
import SetupPage   from './pages/SetupPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#999' }}>
        Loading…
      </div>
    )
  }

  if (!user)    return <LoginPage />
  if (!profile) return <SetupPage />

  return (
    <Routes>
      <Route path="/"         element={<Dashboard />} />
      <Route path="/song/:id" element={<SongPage />}  />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
