import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import NudgeToast from './components/NudgeToast'
import { armScheduledNotifications, checkIncomingNudges } from './lib/notifications'

function AppInner() {
  const { session, loading, currentUserId, profile } = useAuth()
  const [incomingNudge, setIncomingNudge] = useState(null)

  useEffect(() => {
    if (!session || !currentUserId) return
    armScheduledNotifications(profile?.display_name || 'friend')
    checkIncomingNudges(currentUserId, (nudge) => {
      setIncomingNudge(nudge)
      if (Notification.permission === 'granted') {
        new Notification("You've been nudged 🙏", { body: nudge.message, icon: '/grace-logo.png' })
      }
    })
  }, [session, currentUserId])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f5f4f1' }}>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: '#0d0d0a', overflow: 'hidden' }}>
        <img src="/grace-logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ fontSize: '14px', color: '#888' }}>Loading…</div>
    </div>
  )

  return (
    <>
      {session ? <Dashboard /> : <LoginPage />}
      {incomingNudge && <NudgeToast nudge={incomingNudge} onDismiss={() => setIncomingNudge(null)} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
