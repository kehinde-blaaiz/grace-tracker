import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { NT_BOOKS } from '../data/readingPlan'

export default function ReadingPlanSettings({ profile, partner, updateProfile, onPlanChange }) {
  const [pendingProposal, setPendingProposal] = useState(null)
  const [myProposal, setMyProposal] = useState(null)
  const [proposing, setProposing] = useState(false)
  const [newBook, setNewBook] = useState(profile?.plan_book || 'Mark')
  const [newChapters, setNewChapters] = useState(profile?.plan_chapters_per_day || 1)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentBook = profile?.plan_book || 'Mark'
  const currentChapters = profile?.plan_chapters_per_day || 1

  useEffect(() => {
    if (!profile?.id) return
    fetchProposals()
  }, [profile?.id])

  const fetchProposals = async () => {
    const { data } = await supabase
      .from('plan_proposals')
      .select('*')
      .or(`proposed_by.eq.${profile.id},proposed_to.eq.${profile.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      const incoming = data.find(p => p.proposed_to === profile.id)
      const outgoing = data.find(p => p.proposed_by === profile.id)
      setPendingProposal(incoming || null)
      setMyProposal(outgoing || null)
    }
  }

  const handlePropose = async () => {
    if (!partner?.id) return
    setProposing(true)
    // Cancel any existing proposal first
    if (myProposal) {
      await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', myProposal.id)
    }
    const { data } = await supabase.from('plan_proposals').insert({
      proposed_by: profile.id,
      proposed_to: partner.id,
      book: newBook,
      chapters_per_day: newChapters,
    }).select().single()
    if (data) setMyProposal(data)
    setShowForm(false)
    setProposing(false)
  }

  const handleApprove = async () => {
    if (!pendingProposal) return
    setLoading(true)
    // Apply to both profiles
    await Promise.all([
      supabase.from('profiles').update({ plan_book: pendingProposal.book, plan_chapters_per_day: pendingProposal.chapters_per_day }).eq('id', profile.id),
      supabase.from('profiles').update({ plan_book: pendingProposal.book, plan_chapters_per_day: pendingProposal.chapters_per_day }).eq('id', pendingProposal.proposed_by),
      supabase.from('plan_proposals').update({ status: 'approved' }).eq('id', pendingProposal.id),
    ])
    await updateProfile({ plan_book: pendingProposal.book, plan_chapters_per_day: pendingProposal.chapters_per_day })
    setPendingProposal(null)
    onPlanChange?.(pendingProposal.book, pendingProposal.chapters_per_day)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReject = async () => {
    if (!pendingProposal) return
    await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', pendingProposal.id)
    setPendingProposal(null)
  }

  const handleSaveOwn = async () => {
    if (!partner) {
      // No partner — just apply directly
      setLoading(true)
      await updateProfile({ plan_book: newBook, plan_chapters_per_day: newChapters })
      onPlanChange?.(newBook, newChapters)
      setShowForm(false)
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      handlePropose()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Current plan */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '0.5px solid #f0ede6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-book" style={{ fontSize: '15px', color: '#1a3a0a' }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#1a1a12', fontWeight: '500' }}>Reading plan</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>
                Starting {currentBook} · {currentChapters} chapter{currentChapters > 1 ? 's' : ''}/day
              </div>
            </div>
            <button onClick={() => setShowForm(f => !f)} style={{ fontSize: '12px', color: '#1a3a0a', background: 'none', border: '0.5px solid #1a3a0a', borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {showForm ? 'Cancel' : 'Change'}
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Start from</div>
              <select value={newBook} onChange={e => setNewBook(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#f5f4f1', color: '#1a1a12', outline: 'none' }}>
                {NT_BOOKS.map(b => (
                  <option key={b.name} value={b.name}>{b.name} ({b.chapters} chapters)</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Chapters per day</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setNewChapters(n)} style={{ flex: 1, padding: '10px', border: `1.5px solid ${newChapters === n ? '#1a3a0a' : '#e8e6e2'}`, borderRadius: '10px', background: newChapters === n ? '#EAF3DE' : 'transparent', color: newChapters === n ? '#1a3a0a' : '#888', fontSize: '14px', fontWeight: newChapters === n ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveOwn} disabled={proposing || loading} style={{ padding: '12px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
              {partner ? (proposing ? 'Sending…' : `Propose to ${partner.display_name}`) : (loading ? 'Saving…' : 'Save plan')}
            </button>

            {partner && (
              <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', lineHeight: '1.5' }}>
                Your partner will need to approve before the plan changes for both of you.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Incoming proposal */}
      {pendingProposal && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: '16px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '4px' }}>
            📖 New reading plan proposed
          </div>
          <div style={{ fontSize: '13px', color: '#633806', marginBottom: '12px', lineHeight: '1.5' }}>
            {partner?.display_name || 'Your partner'} wants to start from <strong>{pendingProposal.book}</strong> reading <strong>{pendingProposal.chapters_per_day} chapter{pendingProposal.chapters_per_day > 1 ? 's' : ''}/day</strong>.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleApprove} disabled={loading} style={{ flex: 1, padding: '10px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Applying…' : '✓ Approve'}
            </button>
            <button onClick={handleReject} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#A32D2D', border: '0.5px solid #F09595', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ Decline
            </button>
          </div>
        </div>
      )}

      {/* My outgoing proposal */}
      {myProposal && !pendingProposal && (
        <div style={{ background: '#f5f4f1', border: '0.5px solid #e8e6e2', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="ti ti-clock" style={{ fontSize: '16px', color: '#888', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
            Waiting for {partner?.display_name || 'your partner'} to approve: <strong>{myProposal.book}</strong>, {myProposal.chapters_per_day} chapter{myProposal.chapters_per_day > 1 ? 's' : ''}/day
          </div>
        </div>
      )}

      {saved && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#27500A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-check" style={{ fontSize: '14px' }} aria-hidden="true" /> Reading plan updated for both of you
        </div>
      )}
    </div>
  )
}
