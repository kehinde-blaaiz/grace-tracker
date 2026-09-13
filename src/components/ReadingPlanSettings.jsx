import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OT_BOOKS, NT_BOOKS, ALL_BOOKS } from '../data/readingPlan'

const TESTAMENT_OPTIONS = [
  { value: 'nt', label: 'New Testament', icon: '✝️' },
  { value: 'ot', label: 'Old Testament', icon: '📜' },
  { value: 'both', label: 'Whole Bible', icon: '📖' },
]

function getBooksForTestament(testament) {
  if (testament === 'ot') return OT_BOOKS
  if (testament === 'nt') return NT_BOOKS
  return ALL_BOOKS
}

export default function ReadingPlanSettings({ profile, partner, updateProfile, onPlanChange }) {
  const [pendingProposal, setPendingProposal] = useState(null)
  const [myProposal, setMyProposal] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentBook = profile?.plan_book || 'Mark'
  const currentChapters = profile?.plan_chapters_per_day || 1
  const currentTestament = profile?.plan_testament || 'nt'

  const [newTestament, setNewTestament] = useState(currentTestament)
  const [newBook, setNewBook] = useState(currentBook)
  const [newChapters, setNewChapters] = useState(currentChapters)

  const availableBooks = getBooksForTestament(newTestament)

  // When testament changes, reset to first book of that testament
  useEffect(() => {
    const books = getBooksForTestament(newTestament)
    if (!books.find(b => b.name === newBook)) {
      setNewBook(books[0].name)
    }
  }, [newTestament])

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
      setPendingProposal(data.find(p => p.proposed_to === profile.id) || null)
      setMyProposal(data.find(p => p.proposed_by === profile.id) || null)
    }
  }

  const applyPlan = async (book, chapters, testament) => {
    await updateProfile({ plan_book: book, plan_chapters_per_day: chapters, plan_testament: testament })
    onPlanChange?.(book, chapters, testament)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSave = async () => {
    setLoading(true)
    if (!partner) {
      await applyPlan(newBook, newChapters, newTestament)
      setShowForm(false)
    } else {
      // Propose to partner
      if (myProposal) {
        await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', myProposal.id)
      }
      const { data } = await supabase.from('plan_proposals').insert({
        proposed_by: profile.id,
        proposed_to: partner.id,
        book: newBook,
        chapters_per_day: newChapters,
        testament: newTestament,
      }).select().single()
      if (data) setMyProposal(data)
      setShowForm(false)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!pendingProposal) return
    setLoading(true)
    const { book, chapters_per_day, testament } = pendingProposal
    await Promise.all([
      supabase.from('profiles').update({ plan_book: book, plan_chapters_per_day: chapters_per_day, plan_testament: testament || 'nt' }).eq('id', profile.id),
      supabase.from('profiles').update({ plan_book: book, plan_chapters_per_day: chapters_per_day, plan_testament: testament || 'nt' }).eq('id', pendingProposal.proposed_by),
      supabase.from('plan_proposals').update({ status: 'approved' }).eq('id', pendingProposal.id),
    ])
    await updateProfile({ plan_book: book, plan_chapters_per_day: chapters_per_day, plan_testament: testament || 'nt' })
    onPlanChange?.(book, chapters_per_day, testament || 'nt')
    setPendingProposal(null)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReject = async () => {
    await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', pendingProposal.id)
    setPendingProposal(null)
  }

  const testamentLabel = TESTAMENT_OPTIONS.find(t => t.value === currentTestament)?.label || 'New Testament'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Current plan display */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: showForm ? '0.5px solid #f0ede6' : 'none' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-book" style={{ fontSize: '15px', color: '#1a3a0a' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#1a1a12', fontWeight: '500' }}>Reading plan</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>
              {testamentLabel} · from {currentBook} · {currentChapters} ch/day
            </div>
          </div>
          <button onClick={() => setShowForm(f => !f)} style={{ fontSize: '12px', color: '#1a3a0a', background: 'none', border: '0.5px solid #1a3a0a', borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {showForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showForm && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Testament selection */}
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Reading from</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {TESTAMENT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setNewTestament(opt.value)} style={{ flex: 1, padding: '10px 6px', border: `1.5px solid ${newTestament === opt.value ? '#1a3a0a' : '#e8e6e2'}`, borderRadius: '10px', background: newTestament === opt.value ? '#EAF3DE' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '10px', color: newTestament === opt.value ? '#1a3a0a' : '#888', fontWeight: newTestament === opt.value ? '600' : '400', textAlign: 'center', lineHeight: '1.3' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start book */}
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Start from</div>
              <select value={newBook} onChange={e => setNewBook(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#f5f4f1', color: '#1a1a12', outline: 'none' }}>
                {availableBooks.map(b => (
                  <option key={b.name} value={b.name}>{b.name} ({b.chapters} ch)</option>
                ))}
              </select>
            </div>

            {/* Chapters per day */}
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Chapters per day</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setNewChapters(n)} style={{ flex: 1, padding: '12px', border: `1.5px solid ${newChapters === n ? '#1a3a0a' : '#e8e6e2'}`, borderRadius: '10px', background: newChapters === n ? '#EAF3DE' : 'transparent', color: newChapters === n ? '#1a3a0a' : '#888', fontSize: '18px', fontWeight: newChapters === n ? '700' : '400', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', textAlign: 'center' }}>
                {newChapters === 1 ? '5 chapters/week · steady pace' : newChapters === 2 ? '10 chapters/week · committed' : '15 chapters/week · intensive'}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading} style={{ padding: '13px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Saving…' : partner ? `Propose to ${partner.display_name}` : 'Save plan'}
            </button>

            {partner && (
              <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', lineHeight: '1.5' }}>
                {partner.display_name} will need to approve before the plan changes for both of you.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Incoming proposal */}
      {pendingProposal && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: '16px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '4px' }}>📖 New reading plan proposed</div>
          <div style={{ fontSize: '13px', color: '#633806', marginBottom: '12px', lineHeight: '1.6' }}>
            {partner?.display_name || 'Your partner'} wants to read the <strong>{TESTAMENT_OPTIONS.find(t => t.value === (pendingProposal.testament || 'nt'))?.label}</strong>, starting from <strong>{pendingProposal.book}</strong>, <strong>{pendingProposal.chapters_per_day} chapter{pendingProposal.chapters_per_day > 1 ? 's' : ''}/day</strong>.
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
            Waiting for {partner?.display_name || 'your partner'} to approve: <strong>{myProposal.book}</strong>, {myProposal.chapters_per_day} ch/day
          </div>
        </div>
      )}

      {saved && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#27500A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-check" style={{ fontSize: '14px' }} aria-hidden="true" /> Reading plan updated
        </div>
      )}
    </div>
  )
}
