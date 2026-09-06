import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import LinkPartnerPage from './pages/LinkPartnerPage'
import NudgeToast from './components/NudgeToast'
import { armScheduledNotifications, checkIncomingNudges } from './lib/notifications'

function AppInner() {
  const { session, loading, currentUserId, profile, getPartner } = useAuth()
  const [incomingNudge, setIncomingNudge] = useState(null)
  // Track if user explicitly skipped linking — stored in localStorage
  const [skippedLinking, setSkippedLinking] = useState(
    () => localStorage.getItem('grace_skipped_linking') === 'true'
  )
  const partner = getPartner()

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

  // When partner links, clear the skipped flag so dashboard updates properly
  useEffect(() => {
    if (partner) localStorage.removeItem('grace_skipped_linking')
  }, [partner])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f5f4f1', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: '#0d0d0a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/grace-logo.png" alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: '14px', color: '#888' }}>Loading…</div>
    </div>
  )

  if (!session) return <LoginPage />

  return (
    <>
      <Dashboard />
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
