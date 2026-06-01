import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import './App.css'

function AppInner() {
  const { session, loading } = useAuth()

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-cross">✝</div>
      <p>Loading…</p>
    </div>
  )

  return session ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
