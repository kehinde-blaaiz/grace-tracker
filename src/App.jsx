import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AdminPage from './pages/AdminPage'
import NudgeToast from './components/NudgeToast'
import { armScheduledNotifications, checkIncomingNudges } from './lib/notifications'
import { supabase } from './lib/supabase'

function AppInner() {
  const { session, loading, currentUserId, profile } = useAuth()
  const [incomingNudge, setIncomingNudge] = useState(null)
  const [pendingProposal, setPendingProposal] = useState(null)
  const [showProposalModal, setShowProposalModal] = useState(false)

  if (window.location.pathname === '/admin') return <AdminPage />

  useEffect(() => {
    if (!session || !currentUserId) return
    armScheduledNotifications(profile?.display_name || 'friend')
    checkIncomingNudges(currentUserId, (nudge) => {
      setIncomingNudge(nudge)
      if (Notification.permission === 'granted') {
        new Notification("You've been nudged 🙏", { body: nudge.message, icon: '/grace-logo.svg' })
      }
    })
    // Check for pending reading plan proposals
    checkPendingProposal(currentUserId)
  }, [session, currentUserId])

  const checkPendingProposal = async (userId) => {
    const { data } = await supabase
      .from('plan_proposals')
      .select('*, profiles!plan_proposals_proposed_by_fkey(display_name)')
      .eq('proposed_to', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      setPendingProposal(data)
      setShowProposalModal(true)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f5f4f1', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: '#0d0d0a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/grace-logo.svg" alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: '14px', color: '#888' }}>Loading…</div>
    </div>
  )

  if (!session) return <LoginPage />

  const testamentLabel = (t) => {
    if (t === 'ot') return 'Old Testament'
    if (t === 'nt') return 'New Testament'
    if (t === 'both-sequential') return 'Whole Bible (straight through)'
    if (t === 'both-parallel') return 'Whole Bible (OT + NT daily)'
    return 'New Testament'
  }

  return (
    <>
      <Dashboard />

      {/* Pending proposal overlay */}
      {showProposalModal && pendingProposal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200, fontFamily: '-apple-system, sans-serif' }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#e5e2db', borderRadius: '999px', margin: '0 auto 20px' }} />

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📖</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a12', marginBottom: '6px' }}>New reading plan proposed</div>
              <div style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}>
                <strong>{pendingProposal.profiles?.display_name || 'Your partner'}</strong> wants to change your reading plan to:
              </div>
            </div>

            <div style={{ background: '#f5f4f1', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Reading from</span>
                  <span style={{ fontSize: '13px', color: '#1a1a12', fontWeight: '500' }}>{testamentLabel(pendingProposal.testament || 'nt')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Starting at</span>
                  <span style={{ fontSize: '13px', color: '#1a1a12', fontWeight: '500' }}>{pendingProposal.book}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Chapters/day</span>
                  <span style={{ fontSize: '13px', color: '#1a1a12', fontWeight: '500' }}>{pendingProposal.chapters_per_day}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setShowProposalModal(false); window.location.hash = '#profile' }}
                style={{ width: '100%', padding: '14px', background: '#1a3a0a', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Review in Profile →
              </button>
              <button
                onClick={() => setShowProposalModal(false)}
                style={{ width: '100%', padding: '14px', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '14px', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
      )}

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

