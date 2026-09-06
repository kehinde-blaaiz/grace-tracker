import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import NudgeToast from './components/NudgeToast'
import { armScheduledNotifications, checkIncomingNudges } from './lib/notifications'
import './App.css'

function AppInner() {
  const { session, loading, currentUserId, profile } = useAuth()
  const [incomingNudge, setIncomingNudge] = useState(null)

  useEffect(() => {
    if (!session || !currentUserId) return

    // Re-arm any scheduled notification timers on every app load
    armScheduledNotifications(profile?.display_name || 'friend')

    // Check for unread nudges from partner
    checkIncomingNudges(currentUserId, (nudge) => {
      setIncomingNudge(nudge)
      // Also fire a browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('You\'ve been nudged 🙏', {
          body: nudge.message,
          icon: '/icon-192.png',
        })
      }
    })
  }, [session, currentUserId])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-cross">✝</div>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <>
      {session ? <Dashboard /> : <LoginPage />}
      {incomingNudge && (
        <NudgeToast
          nudge={incomingNudge}
          onDismiss={() => setIncomingNudge(null)}
        />
      )}
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
