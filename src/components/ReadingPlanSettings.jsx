import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OT_BOOKS, NT_BOOKS, ALL_BOOKS } from '../data/readingPlan'

function getBooksForTestament(testament) {
  if (testament === 'ot') return OT_BOOKS
  if (testament === 'nt') return NT_BOOKS
  return ALL_BOOKS
}

function testamentLabel(t) {
  if (t === 'ot') return 'Old Testament'
  if (t === 'nt') return 'New Testament'
  if (t === 'both-sequential') return 'Whole Bible (sequential)'
  if (t === 'both-parallel') return 'Whole Bible (parallel)'
  return t
}

export default function ReadingPlanSettings({ profile, partner, updateProfile, onPlanChange }) {
  const [pendingProposal, setPendingProposal] = useState(null)
  const [myProposal, setMyProposal] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentTestament = profile?.plan_testament || 'nt'
  const currentBook = profile?.plan_book || 'Mark'
  const currentChapters = profile?.plan_chapters_per_day || 1
  const currentOTBook = profile?.plan_ot_book || 'Genesis'
  const currentNTBook = profile?.plan_nt_book || 'Matthew'

  const [newTestament, setNewTestament] = useState(currentTestament)
  const [newBook, setNewBook] = useState(currentBook)
  const [newChapters, setNewChapters] = useState(currentChapters)
  const [newOTBook, setNewOTBook] = useState(currentOTBook)
  const [newNTBook, setNewNTBook] = useState(currentNTBook)

  const isParallel = newTestament === 'both-parallel'
  const isSequential = newTestament === 'nt' || newTestament === 'ot' || newTestament === 'both-sequential'

  useEffect(() => {
    if (!profile?.id) return
    fetchProposals()
  }, [profile?.id])

  const fetchProposals = async () => {
    const { data } = await supabase
      .from('plan_proposals').select('*')
      .or(`proposed_by.eq.${profile.id},proposed_to.eq.${profile.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(5)
    if (data) {
      setPendingProposal(data.find(p => p.proposed_to === profile.id) || null)
      setMyProposal(data.find(p => p.proposed_by === profile.id) || null)
    }
  }

  const buildUpdates = () => ({
    plan_testament: newTestament,
    plan_book: isParallel ? newOTBook : newBook,
    plan_ot_book: newOTBook,
    plan_nt_book: newNTBook,
    plan_chapters_per_day: newChapters,
  })

  const handleSave = async () => {
    setLoading(true)
    const updates = buildUpdates()
    if (!partner) {
      await updateProfile(updates)
      onPlanChange?.(updates.plan_book, newChapters, newTestament, newOTBook, newNTBook)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      setShowForm(false)
    } else {
      if (myProposal) await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', myProposal.id)
      const { data } = await supabase.from('plan_proposals').insert({
        proposed_by: profile.id, proposed_to: partner.id,
        book: updates.plan_book, chapters_per_day: newChapters,
        testament: newTestament, ot_book: newOTBook, nt_book: newNTBook,
      }).select().single()
      if (data) setMyProposal(data)
      setShowForm(false)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!pendingProposal) return
    setLoading(true)
    const u = { plan_book: pendingProposal.book, plan_chapters_per_day: pendingProposal.chapters_per_day, plan_testament: pendingProposal.testament || 'nt', plan_ot_book: pendingProposal.ot_book || 'Genesis', plan_nt_book: pendingProposal.nt_book || 'Matthew' }
    await Promise.all([
      supabase.from('profiles').update(u).eq('id', profile.id),
      supabase.from('profiles').update(u).eq('id', pendingProposal.proposed_by),
      supabase.from('plan_proposals').update({ status: 'approved' }).eq('id', pendingProposal.id),
    ])
    await updateProfile(u)
    onPlanChange?.(u.plan_book, u.plan_chapters_per_day, u.plan_testament, u.plan_ot_book, u.plan_nt_book)
    setPendingProposal(null)
    setLoading(false)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const handleReject = async () => {
    await supabase.from('plan_proposals').update({ status: 'rejected' }).eq('id', pendingProposal.id)
    setPendingProposal(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: showForm ? '0.5px solid #f0ede6' : 'none' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-book" style={{ fontSize: '15px', color: '#1a3a0a' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#1a1a12', fontWeight: '500' }}>Reading plan</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>
              {testamentLabel(currentTestament)} · {currentChapters} ch/day
            </div>
          </div>
          <button onClick={() => setShowForm(f => !f)} style={{ fontSize: '12px', color: '#1a3a0a', background: 'none', border: '0.5px solid #1a3a0a', borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {showForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showForm && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Testament */}
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Reading from</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { value: 'nt', icon: '✝️', label: 'New Testament' },
                  { value: 'ot', icon: '📜', label: 'Old Testament' },
                  { value: 'both-sequential', icon: '📖', label: 'Whole Bible', sub: 'straight through' },
                  { value: 'both-parallel', icon: '🔀', label: 'Whole Bible', sub: 'OT + NT each day' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setNewTestament(opt.value)} style={{ padding: '10px 8px', border: `1.5px solid ${newTestament === opt.value ? '#1a3a0a' : '#e8e6e2'}`, borderRadius: '10px', background: newTestament === opt.value ? '#EAF3DE' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '11px', color: newTestament === opt.value ? '#1a3a0a' : '#888', fontWeight: newTestament === opt.value ? '600' : '400', textAlign: 'center' }}>{opt.label}</span>
                    {opt.sub && <span style={{ fontSize: '10px', color: newTestament === opt.value ? '#3B6D11' : '#aaa', textAlign: 'center' }}>{opt.sub}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Start book(s) */}
            {isParallel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Start OT from</div>
                  <select value={newOTBook} onChange={e => setNewOTBook(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#f5f4f1', color: '#1a1a12', outline: 'none' }}>
                    {OT_BOOKS.map(b => <option key={b.name} value={b.name}>{b.name} ({b.chapters} ch)</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Start NT from</div>
                  <select value={newNTBook} onChange={e => setNewNTBook(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#f5f4f1', color: '#1a1a12', outline: 'none' }}>
                    {NT_BOOKS.map(b => <option key={b.name} value={b.name}>{b.name} ({b.chapters} ch)</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Start from</div>
                <select value={newBook} onChange={e => setNewBook(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#f5f4f1', color: '#1a1a12', outline: 'none' }}>
                  {getBooksForTestament(newTestament).map(b => <option key={b.name} value={b.name}>{b.name} ({b.chapters} ch)</option>)}
                </select>
              </div>
            )}

            {/* Chapters per day */}
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                {isParallel ? 'Chapters per day (split between OT + NT)' : 'Chapters per day'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(isParallel ? [2, 4, 6] : [1, 2, 3]).map((n, i) => (
                  <button key={n} onClick={() => setNewChapters(n)} style={{ flex: 1, padding: '12px', border: `1.5px solid ${newChapters === n ? '#1a3a0a' : '#e8e6e2'}`, borderRadius: '10px', background: newChapters === n ? '#EAF3DE' : 'transparent', color: newChapters === n ? '#1a3a0a' : '#888', fontSize: '16px', fontWeight: newChapters === n ? '700' : '400', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span>{n}</span>
                    {isParallel && <span style={{ fontSize: '9px', color: newChapters === n ? '#3B6D11' : '#bbb' }}>{n/2} OT + {n/2} NT</span>}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', textAlign: 'center' }}>
                {newChapters <= 1 ? '5 chapters/week · steady' : newChapters <= 2 ? '10 chapters/week · committed' : newChapters <= 3 ? '15 chapters/week · intensive' : `${newChapters * 5} chapters/week · intensive`}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading} style={{ padding: '13px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Saving…' : partner ? `Propose to ${partner.display_name}` : 'Save plan'}
            </button>
            {partner && <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>{partner.display_name} will need to approve before the plan changes for both of you.</div>}
          </div>
        )}
      </div>

      {pendingProposal && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: '16px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '4px' }}>📖 New reading plan proposed</div>
          <div style={{ fontSize: '13px', color: '#633806', marginBottom: '12px', lineHeight: '1.6' }}>
            {partner?.display_name || 'Your partner'} wants to read <strong>{testamentLabel(pendingProposal.testament || 'nt')}</strong>, starting from <strong>{pendingProposal.book}</strong>, <strong>{pendingProposal.chapters_per_day} ch/day</strong>.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleApprove} disabled={loading} style={{ flex: 1, padding: '10px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Applying…' : '✓ Approve'}</button>
            <button onClick={handleReject} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#A32D2D', border: '0.5px solid #F09595', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Decline</button>
          </div>
        </div>
      )}

      {myProposal && !pendingProposal && (
        <div style={{ background: '#f5f4f1', border: '0.5px solid #e8e6e2', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="ti ti-clock" style={{ fontSize: '16px', color: '#888', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ fontSize: '12px', color: '#888' }}>Waiting for {partner?.display_name || 'partner'} to approve: <strong>{myProposal.book}</strong>, {myProposal.chapters_per_day} ch/day</div>
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
