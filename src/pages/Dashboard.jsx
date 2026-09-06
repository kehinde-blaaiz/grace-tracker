import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { READING_PLAN, getStreakTitle, SS_LESSON_URL } from '../data/readingPlan'
import NudgeButton from '../components/NudgeButton'
import NotificationSettings from '../components/NotificationSettings'

export default function Dashboard() {
  const { profile, signOut, getPartner, updateProfile, currentUserId } = useAuth()
  const partner = getPartner()
  const myProgress = useProgress(currentUserId)
  const partnerProgress = useProgress(partner?.id)

  const [activeTab, setActiveTab] = useState('today')
  const [currentWeek, setCurrentWeek] = useState(1)
  const [toast, setToast] = useState('')
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [calMonth, setCalMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }))

  useEffect(() => {
    try {
      let startDate = localStorage.getItem('grace_start_date')
      if (!startDate) { startDate = new Date().toISOString().split('T')[0]; localStorage.setItem('grace_start_date', startDate) }
      const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
      setCurrentWeek(Math.max(1, Math.min(Math.floor(diff / 7) + 1, READING_PLAN.length)))
    } catch { setCurrentWeek(1) }
  }, [])

  const celebrate = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const todayKey = new Date().toISOString().split('T')[0]
  const todayDOW = new Date().getDay()
  const isSat = todayDOW === 6
  const isSun = todayDOW === 0
  const todayDayIndex = (todayDOW === 0 || todayDOW === 6) ? null : todayDOW - 1
  const weekData = READING_PLAN[currentWeek - 1]
  const todayReading = todayDayIndex !== null && weekData ? weekData.days[todayDayIndex] : null
  const streakTitle = getStreakTitle(myProgress.data.streak.current_streak)
  const prayerTimes = { morning: profile?.prayer_morning ?? true, afternoon: profile?.prayer_afternoon ?? false, night: profile?.prayer_night ?? true }

  const prayerSlots = [
    prayerTimes.morning   && { key: 'morning',   label: 'Morning prayer',   icon: 'ti-sunrise', color: '#BA7517', bg: '#FFF8ED' },
    prayerTimes.afternoon && { key: 'afternoon', label: 'Afternoon prayer', icon: 'ti-sun',     color: '#185FA5', bg: '#E6F1FB' },
    prayerTimes.night     && { key: 'night',     label: 'Evening prayer',   icon: 'ti-moon',    color: '#534AB7', bg: '#F0EEF8' },
  ].filter(Boolean)

  const prayerData = myProgress.data.prayers[todayKey] || {}
  const readingDone = todayReading ? !!myProgress.data.readings[`w${currentWeek}_d${todayDayIndex}`]?.done : false
  const prayerAllDone = prayerSlots.length > 0 && prayerSlots.every(s => prayerData[s.key])
  const dayComplete = readingDone && prayerAllDone

  // Avatar display helper
  const AvatarDisplay = ({ size = 60, fontSize = 22 }) => {
    const url = profile?.avatar_url
    const initial = (profile?.display_name || 'U')[0].toUpperCase()
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: profile?.avatar_color || '#1a3a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: url?.startsWith('emoji:') ? size * 0.48 : fontSize, fontWeight: '600', border: '3px solid #fff', boxShadow: '0 0 0 1.5px #e8e6e2', overflow: 'hidden', flexShrink: 0 }}>
        {url?.startsWith('emoji:') ? url.replace('emoji:', '') : url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
      </div>
    )
  }

  if (myProgress.loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f5f4f1' }}>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: '#0d0d0a', overflow: 'hidden' }}>
        <img src="/grace-logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ fontSize: '14px', color: '#888' }}>Loading…</div>
    </div>
  )

  const navColor = (id) => ({ color: activeTab === id ? '#1a3a0a' : '#bbb', fontWeight: activeTab === id ? '600' : '400' })

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f4f1', fontFamily: '-apple-system, sans-serif' }}>

      {toast && (
        <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', background: '#1a3a0a', color: '#fff', padding: '10px 20px', borderRadius: '999px', fontSize: '13px', zIndex: 100, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: '#fff', padding: '20px 18px 16px', borderBottom: '0.5px solid #e8e6e2' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '2px' }}>Your companion for today.</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a12', lineHeight: 1.2 }}>
              {getTimeOfDay()},<br />{profile?.display_name || 'friend'}.
            </div>
          </div>
          <button onClick={() => setShowStreakPopup(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0f0ee', border: '0.5px solid #d8d6d2', borderRadius: '999px', padding: '5px 12px', cursor: 'pointer' }}>
            <i className="ti ti-plant" style={{ fontSize: '14px', color: '#1a3a0a' }} aria-hidden="true" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a12' }}>
              {myProgress.data.streak.last_active_date ? myProgress.data.streak.current_streak : 0}
            </span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
        {activeTab === 'today' && weekData && (
          <TodayTab isSat={isSat} isSun={isSun} weekData={weekData} currentWeek={currentWeek} todayReading={todayReading} todayDayIndex={todayDayIndex} myProgress={myProgress} todayKey={todayKey} prayerSlots={prayerSlots} dayComplete={dayComplete} celebrate={celebrate} profile={profile} />
        )}
        {activeTab === 'week' && weekData && (
          <WeekTab weekData={weekData} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} myProgress={myProgress} celebrate={celebrate} />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab myProgress={myProgress} calMonth={calMonth} setCalMonth={setCalMonth} currentWeek={currentWeek} />
        )}
        {activeTab === 'partner' && (
          <PartnerTab partner={partner} partnerProgress={partnerProgress} currentWeek={currentWeek} myProfile={profile} currentUserId={currentUserId} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab profile={profile} updateProfile={updateProfile} myProgress={myProgress} signOut={signOut} setShowStreakPopup={setShowStreakPopup} setShowAvatarPicker={setShowAvatarPicker} streakTitle={streakTitle} AvatarDisplay={AvatarDisplay} />
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', height: '60px', background: '#fff', borderTop: '0.5px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: '6px', zIndex: 50 }}>
        {[
          { id: 'today',    icon: 'ti-sun',         label: 'Today' },
          { id: 'week',     icon: 'ti-layout-list', label: 'Week' },
          { id: 'calendar', icon: 'ti-calendar',    label: 'Calendar' },
          { id: 'partner',  icon: 'ti-heart',       label: partner?.display_name || 'Partner' },
          { id: 'profile',  icon: 'ti-user-circle', label: 'Profile' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '6px 4px 0' }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: '20px', ...navColor(tab.id) }} aria-hidden="true" />
            <span style={{ fontSize: '9px', ...navColor(tab.id) }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a3a0a' }} />}
          </button>
        ))}
      </div>

      {/* STREAK POPUP */}
      {showStreakPopup && (
        <div onClick={() => setShowStreakPopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 150 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#e5e2db', borderRadius: '999px', margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '4px' }}>{streakTitle.emoji}</div>
              <div style={{ fontSize: '48px', fontWeight: '600', color: '#1a1a12', lineHeight: 1 }}>
                {myProgress.data.streak.last_active_date ? myProgress.data.streak.current_streak : 0}
              </div>
              <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>day streak</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a12', marginTop: '14px' }}>{streakTitle.title}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.6' }}>
                Keep watering your faith and watch it grow.
              </div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '44px', justifyContent: 'center', margin: '16px 0 4px' }}>
                {[10, 16, 22, 30, 36, 44].map((h, i) => (
                  <div key={i} style={{ width: '22px', height: `${h}px`, borderRadius: '4px 4px 0 0', background: i >= 2 ? '#1a3a0a' : '#e8e6e2' }} />
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '16px' }}>growth over weeks</div>
            </div>
            <button onClick={() => setShowStreakPopup(false)} style={{ width: '100%', padding: '14px', background: '#1a3a0a', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div onClick={() => setShowAvatarPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '340px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a12', marginBottom: '4px' }}>Profile photo</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Choose how your avatar appears.</div>

            {/* Hidden inputs */}
            <input type="file" accept="image/*" id="avatar-upload" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async (ev) => {
                  await updateProfile({ avatar_url: ev.target.result })
                  setShowAvatarPicker(false)
                }
                reader.readAsDataURL(file)
              }}
            />
            <input type="file" accept="image/*" capture="user" id="avatar-camera" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async (ev) => {
                  await updateProfile({ avatar_url: ev.target.result })
                  setShowAvatarPicker(false)
                }
                reader.readAsDataURL(file)
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Take photo',    icon: 'ti-camera',     bg: '#EAF3DE', color: '#1a3a0a', action: () => document.getElementById('avatar-camera').click() },
                { label: 'Upload image',  icon: 'ti-photo',      bg: '#E6F1FB', color: '#185FA5', action: () => document.getElementById('avatar-upload').click() },
                { label: 'Choose emoji',  icon: 'ti-mood-smile', bg: '#FAEEDA', color: '#BA7517', action: () => { setShowAvatarPicker(false); setShowEmojiPicker(true) } },
                { label: 'Remove photo',  icon: 'ti-trash',      bg: '#FCEBEB', color: '#A32D2D', action: async () => { await updateProfile({ avatar_url: null }); setShowAvatarPicker(false) }, danger: true },
              ].map(opt => (
                <button key={opt.label} onClick={opt.action} style={{ border: `0.5px solid ${opt.danger ? '#F09595' : '#e8e6e2'}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', cursor: 'pointer' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${opt.icon}`} style={{ fontSize: '16px', color: opt.color }} aria-hidden="true" />
                  </div>
                  <span style={{ fontSize: '13px', color: opt.danger ? '#A32D2D' : '#1a1a12', fontWeight: '500', textAlign: 'left' }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setShowAvatarPicker(false)} style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '12px', color: '#666', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div onClick={() => setShowEmojiPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '340px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a12', marginBottom: '16px' }}>Choose an emoji</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {['😊','🙏','✝️','⭐','🌱','🕊️','👑','🛡️','🌟','⚓','🔥','💎','🌿','🍃','🦋','📖','🌸','🏆'].map(emoji => (
                <button key={emoji} onClick={async () => { await updateProfile({ avatar_url: `emoji:${emoji}` }); setShowEmojiPicker(false) }} style={{ fontSize: '24px', padding: '8px', border: '0.5px solid #e8e6e2', borderRadius: '10px', background: 'none', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={() => setShowEmojiPicker(false)} style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '12px', color: '#666', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Today tab ──────────────────────────────────────────────────────────────────
function TodayTab({ isSat, isSun, weekData, currentWeek, todayReading, todayDayIndex, myProgress, todayKey, prayerSlots, dayComplete, celebrate, profile }) {
  const [verseNote, setVerseNote] = useState('')
  const [editingVerse, setEditingVerse] = useState(false)
  const [dayCompleteCelebrated, setDayCompleteCelebrated] = useState(false)

  const readingKey = todayReading ? `w${currentWeek}_d${todayDayIndex}` : null
  const isDone = readingKey ? !!myProgress.data.readings[readingKey]?.done : false
  const savedVerse = readingKey ? myProgress.data.verses[readingKey] : ''
  const prayerData = myProgress.data.prayers[todayKey] || {}
  const ssData = myProgress.data.ssProgress[`w${weekData.weekNum}`] || {}

  useEffect(() => { if (savedVerse) setVerseNote(savedVerse) }, [savedVerse])
  useEffect(() => {
    if (dayComplete && !dayCompleteCelebrated) {
      setDayCompleteCelebrated(true)
      celebrate('Day complete! God is pleased.')
    }
  }, [dayComplete])

  if (isSun) return (
    <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', border: '0.5px solid #e8e6e2', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✝</div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a12', marginBottom: '6px' }}>Sunday rest</div>
        <div style={{ fontSize: '14px', color: '#888' }}>It's the Lord's day. Rest, worship, and give thanks.</div>
      </div>
      <PrayerCard slots={prayerSlots} prayerData={prayerData} todayKey={todayKey} myProgress={myProgress} celebrate={celebrate} />
      {profile?.offering_amount > 0 && <OfferingCard data={myProgress.data.offerings[todayKey]} todayKey={todayKey} myProgress={myProgress} offeringAmount={profile.offering_amount} />}
    </div>
  )

  if (isSat) return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.06em' }}>SATURDAY — REVIEW DAY</div>
      <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#185FA5', letterSpacing: '0.05em' }}>SUNDAY SCHOOL</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a12' }}>Lesson {weekData.ssLesson}</span>
        </div>
        {[{ field: 'lesson_read', label: "I've read this week's lesson" }, { field: 'lesson_reviewed', label: 'Reviewed with partner' }].map((item, i) => (
          <label key={item.field} onClick={() => { myProgress.markSSLesson(weekData.weekNum, item.field, !ssData[item.field]); if (!ssData[item.field]) celebrate('Done!') }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i === 0 ? '0.5px solid #f0ede6' : 'none', cursor: 'pointer' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `1.5px solid ${ssData[item.field] ? '#1a3a0a' : '#d8d6d2'}`, background: ssData[item.field] ? '#1a3a0a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {ssData[item.field] && <i className="ti ti-check" style={{ fontSize: '12px', color: '#fff' }} aria-hidden="true" />}
            </div>
            <span style={{ fontSize: '14px', color: '#1a1a12' }}>{item.label}</span>
          </label>
        ))}
        <a href={SS_LESSON_URL} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: '#185FA5', textDecoration: 'none', fontWeight: '500' }}>Open Sunday school library →</a>
      </div>
      <WeeklyVerseCard weekNum={weekData.weekNum} myProgress={myProgress} />
      <PrayerCard slots={prayerSlots} prayerData={prayerData} todayKey={todayKey} myProgress={myProgress} celebrate={celebrate} />
    </div>
  )

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {dayComplete && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="ti ti-circle-check" style={{ fontSize: '22px', color: '#2D5016', flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#27500A' }}>Day complete</div>
            <div style={{ fontSize: '12px', color: '#3B6D11', marginTop: '1px', fontStyle: 'italic' }}>Reading and prayer done. God is pleased.</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.06em' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} · WEEK {currentWeek} · SS LESSON {weekData.ssLesson}
      </div>

      {todayReading ? (
        <>
          <div style={{ background: isDone ? '#EAF3DE' : '#fff', border: `0.5px solid ${isDone ? '#97C459' : '#e8e6e2'}`, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isDone ? '#2D5016' : '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${isDone ? 'ti-check' : 'ti-book'}`} style={{ fontSize: '18px', color: isDone ? '#fff' : '#1a3a0a' }} aria-hidden="true" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Today's reading</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a12' }}>{todayReading.label}</div>
              </div>
              <button onClick={() => { myProgress.markReading(currentWeek, todayDayIndex, !isDone); if (!isDone) celebrate('Reading marked!') }} style={{ padding: '8px 14px', borderRadius: '999px', background: isDone ? '#2D5016' : '#1a3a0a', color: '#fff', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {isDone ? '✓ Done' : 'Mark done'}
              </button>
            </div>
            {todayReading.readSSLesson && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid #e8e6e2', fontSize: '12px', color: '#185FA5' }}>
                <i className="ti ti-book-2" style={{ fontSize: '12px', marginRight: '4px' }} aria-hidden="true" />
                Also start reading <a href={SS_LESSON_URL} target="_blank" rel="noreferrer" style={{ color: '#185FA5', fontWeight: '500' }}>SS Lesson {weekData.ssLesson}</a> today
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', marginBottom: '10px' }}>ONE VERSE THAT CAUGHT YOUR EYE</div>
            {editingVerse || !savedVerse ? (
              <>
                <textarea value={verseNote} onChange={e => setVerseNote(e.target.value)} placeholder={`e.g. ${todayReading.label} — In the beginning...`} rows={3} style={{ width: '100%', border: '0.5px solid #e8e6e2', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', fontStyle: 'italic', background: '#f5f4f1', outline: 'none', color: '#1a1a12', resize: 'none', lineHeight: '1.6' }} />
                <button onClick={() => { myProgress.saveVerse(currentWeek, todayDayIndex, verseNote); setEditingVerse(false); celebrate('Verse saved!') }} style={{ marginTop: '8px', padding: '8px 16px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>Save verse</button>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#555', lineHeight: '1.6', background: '#f5f4f1', borderRadius: '10px', padding: '10px 12px' }}>"{savedVerse}"</div>
                <button onClick={() => setEditingVerse(true)} style={{ marginTop: '8px', fontSize: '12px', color: '#888', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '14px' }}>No reading today.</div>
      )}

      <PrayerCard slots={prayerSlots} prayerData={prayerData} todayKey={todayKey} myProgress={myProgress} celebrate={celebrate} />
    </div>
  )
}

function PrayerCard({ slots, prayerData, todayKey, myProgress, celebrate }) {
  if (slots.length === 0) return null
  const doneCnt = slots.filter(s => prayerData[s.key]).length
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.06em' }}>PRAYER TODAY</span>
        <span style={{ fontSize: '12px', color: '#1a3a0a', fontWeight: '600' }}>{doneCnt}/{slots.length}</span>
      </div>
      {slots.map((slot, i) => (
        <button key={slot.key} onClick={() => { myProgress.markPrayer(todayKey, slot.key, !prayerData[slot.key]); if (!prayerData[slot.key]) celebrate('Prayer logged!') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < slots.length - 1 ? '0.5px solid #f0ede6' : 'none', background: 'none', border: 'none', borderBottom: i < slots.length - 1 ? '0.5px solid #f0ede6' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: slot.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${slot.icon}`} style={{ fontSize: '15px', color: slot.color }} aria-hidden="true" />
          </div>
          <span style={{ flex: 1, fontSize: '14px', color: '#1a1a12' }}>{slot.label}</span>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: prayerData[slot.key] ? '#1a3a0a' : 'transparent', border: `1.5px solid ${prayerData[slot.key] ? '#1a3a0a' : '#d8d6d2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {prayerData[slot.key] && <i className="ti ti-check" style={{ fontSize: '11px', color: '#fff' }} aria-hidden="true" />}
          </div>
        </button>
      ))}
    </div>
  )
}

function WeeklyVerseCard({ weekNum, myProgress }) {
  const val = myProgress.data.weeklyVerses[`w${weekNum}`] || ''
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.06em', marginBottom: '10px' }}>VERSE TO MEMORISE THIS WEEK</div>
      <textarea value={val} onChange={e => myProgress.saveWeeklyVerse(weekNum, e.target.value)} placeholder="Choose your favourite verse from this week's readings…" rows={3} style={{ width: '100%', border: '0.5px solid #e8e6e2', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', fontStyle: 'italic', background: '#f5f4f1', outline: 'none', color: '#1a1a12', resize: 'none', lineHeight: '1.6' }} />
      {val && <div style={{ marginTop: '6px', fontSize: '11px', color: '#1a3a0a' }}>✓ Saved</div>}
    </div>
  )
}

function OfferingCard({ data, todayKey, myProgress, offeringAmount }) {
  const [amount, setAmount] = useState(data?.amount || offeringAmount || '')
  const given = data?.given || false
  return (
    <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: '16px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#854F0B', letterSpacing: '0.06em', marginBottom: '10px' }}>SUNDAY OFFERING</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '15px', color: '#BA7517', fontWeight: '600' }}>₦</span>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1, border: '0.5px solid #EF9F27', borderRadius: '10px', padding: '8px 12px', fontSize: '14px', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={() => myProgress.saveOffering(todayKey, Number(amount), !given)} style={{ padding: '8px 14px', background: given ? '#BA7517' : 'transparent', border: '1.5px solid #BA7517', borderRadius: '10px', color: given ? '#fff' : '#BA7517', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {given ? '✓ Given' : 'Mark given'}
        </button>
      </div>
      {given && <div style={{ marginTop: '8px', fontSize: '12px', color: '#854F0B', fontStyle: 'italic' }}>Thank you — God sees your heart 🙏</div>}
    </div>
  )
}

// ── Week tab ───────────────────────────────────────────────────────────────────
function WeekTab({ weekData, currentWeek, setCurrentWeek, myProgress, celebrate }) {
  const { days, ssLesson, weekNum } = weekData
  const ssData = myProgress.data.ssProgress[`w${weekNum}`] || {}
  const weekReadings = days.map(day => ({ ...day, done: !!myProgress.data.readings[`w${weekNum}_d${day.dayIndex}`]?.done, verse: myProgress.data.verses[`w${weekNum}_d${day.dayIndex}`] || '' }))
  const doneCount = weekReadings.filter(d => d.done).length
  const weeklyVerse = myProgress.data.weeklyVerses[`w${weekNum}`] || ''

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>SS Lesson {ssLesson}</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a12' }}>This week</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['←', currentWeek > 1, () => setCurrentWeek(w => w - 1)], ['→', currentWeek < READING_PLAN.length, () => setCurrentWeek(w => w + 1)]].map(([lbl, enabled, fn]) => (
            <button key={lbl} disabled={!enabled} onClick={fn} style={{ width: '32px', height: '32px', borderRadius: '9px', border: '0.5px solid #d8d6d2', background: 'none', fontSize: '14px', color: enabled ? '#1a1a12' : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed' }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ height: '6px', background: '#e8e6e2', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round((doneCount / days.length) * 100)}%`, background: '#1a3a0a', borderRadius: '999px' }} />
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{doneCount} of {days.length} days read</div>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', overflow: 'hidden' }}>
        {weekReadings.map((day, i) => (
          <div key={day.dayIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: i < weekReadings.length - 1 ? '0.5px solid #f0ede6' : 'none', background: day.done ? '#f7fbf7' : '#fff' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: day.done ? '#1a3a0a' : '#888', width: '32px', flexShrink: 0 }}>{day.dayName.slice(0, 3)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#1a1a12', fontWeight: '500' }}>{day.label}</div>
              {day.verse && <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>"{day.verse}"</div>}
              {day.readSSLesson && <div style={{ fontSize: '11px', color: '#185FA5', marginTop: '2px' }}>📚 Start SS Lesson {ssLesson}</div>}
            </div>
            <button onClick={() => { myProgress.markReading(weekNum, day.dayIndex, !day.done); if (!day.done) celebrate('Reading marked!') }} style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1.5px solid ${day.done ? '#1a3a0a' : '#d8d6d2'}`, background: day.done ? '#1a3a0a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {day.done && <i className="ti ti-check" style={{ fontSize: '12px', color: '#fff' }} aria-hidden="true" />}
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#FAEEDA', borderTop: '0.5px solid #EF9F27' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#854F0B', width: '32px', flexShrink: 0 }}>Sat</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#854F0B', fontWeight: '500' }}>SS review + memorise verse</div>
            {weeklyVerse && <div style={{ fontSize: '11px', color: '#BA7517', fontStyle: 'italic', marginTop: '2px' }}>Memorising: "{weeklyVerse}"</div>}
          </div>
          <div style={{ fontSize: '11px', color: '#854F0B', textAlign: 'right', flexShrink: 0 }}>
            <div>{ssData.lesson_read ? '✓' : '○'} read</div>
            <div>{ssData.lesson_reviewed ? '✓' : '○'} reviewed</div>
          </div>
        </div>
      </div>
      <a href={SS_LESSON_URL} target="_blank" rel="noreferrer" style={{ textAlign: 'center', display: 'block', fontSize: '13px', color: '#185FA5', textDecoration: 'none', fontWeight: '500' }}>Open Sunday school lesson library →</a>
    </div>
  )
}

// ── Calendar tab ───────────────────────────────────────────────────────────────
function CalendarTab({ myProgress, calMonth, setCalMonth, currentWeek }) {
  const { year, month } = calMonth
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const startDate = localStorage.getItem('grace_start_date') ? new Date(localStorage.getItem('grace_start_date')) : new Date()

  const getDayStatus = (d) => {
    const date = new Date(year, month, d)
    const dow = date.getDay()
    if (dow === 0) return 'sunday'
    if (dow === 6) return 'saturday'
    const diffDays = Math.floor((date - startDate) / 86400000)
    if (diffDays < 0) return 'future'
    const weekN = Math.floor(diffDays / 7) + 1
    const dayIdx = dow - 1
    const key = `w${weekN}_d${dayIdx}`
    return myProgress.data.readings[key]?.done ? 'complete' : date < today ? 'missed' : 'future'
  }

  const totalDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const completeDays = totalDays.filter(d => getDayStatus(d) === 'complete').length
  const weekdayCount = totalDays.filter(d => ![0, 6].includes(new Date(year, month, d).getDay())).length

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Your history</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a12' }}>{monthName}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} style={{ width: '32px', height: '32px', borderRadius: '9px', border: '0.5px solid #d8d6d2', background: 'none', fontSize: '14px', color: '#1a1a12', cursor: 'pointer' }}>←</button>
          <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} style={{ width: '32px', height: '32px', borderRadius: '9px', border: '0.5px solid #d8d6d2', background: 'none', fontSize: '14px', color: '#1a1a12', cursor: 'pointer' }}>→</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', padding: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: '#888', fontWeight: '600', paddingBottom: '5px' }}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {totalDays.map(d => {
            const status = getDayStatus(d)
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const styles = {
              complete: { bg: '#1a3a0a', color: '#fff' },
              saturday: { bg: '#FAEEDA', color: '#854F0B', fontSize: '9px' },
              sunday:   { bg: 'transparent', color: '#ddd' },
              missed:   { bg: '#f5f4f1', color: '#ccc' },
              future:   { bg: '#f5f4f1', color: '#888' },
            }[status]
            return (
              <div key={d} style={{ aspectRatio: '1', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: styles.fontSize || '12px', fontWeight: isToday ? '700' : '400', background: styles.bg, color: styles.color, border: isToday ? '2px solid #BA7517' : '0.5px solid transparent' }}>
                {status === 'saturday' ? 'SS' : d}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '10px', borderTop: '0.5px solid #f0ede6' }}>
          {[['#1a3a0a', 'Complete'], ['#FAEEDA', 'Saturday'], ['#f5f4f1', 'Upcoming']].map(([bg, lbl]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: bg, border: '0.5px solid #e8e6e2' }} />{lbl}
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#BA7517', fontWeight: '600', border: '1.5px solid #BA7517', padding: '1px 6px', borderRadius: '5px' }}>today</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{monthName} overview</div>
        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a12' }}>{completeDays} <span style={{ fontSize: '14px', fontWeight: '400', color: '#888' }}>of {weekdayCount} weekdays</span></div>
        <div style={{ fontSize: '13px', color: '#3B6D11', marginTop: '4px', marginBottom: '10px', fontStyle: 'italic' }}>
          {weekdayCount > 0 ? `${Math.round((completeDays / weekdayCount) * 100)}% completion` : 'No weekdays yet'}
        </div>
        <div style={{ height: '6px', background: '#e8e6e2', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${weekdayCount > 0 ? Math.round((completeDays / weekdayCount) * 100) : 0}%`, background: '#1a3a0a', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  )
}

// ── Partner tab ────────────────────────────────────────────────────────────────
function PartnerTab({ partner, partnerProgress, currentWeek, myProfile, currentUserId }) {
  const [viewWeek, setViewWeek] = useState(currentWeek)

  if (!partner) return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>♡</div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a12', marginBottom: '8px' }}>No partner yet</div>
      <div style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}>Once your friend creates an account, they'll appear here automatically.</div>
    </div>
  )

  if (partnerProgress.loading) return <div style={{ padding: '40px', textAlign: 'center', fontSize: '14px', color: '#888' }}>Loading…</div>

  const lastActive = partnerProgress.data.streak.last_active_date
  const streak = lastActive ? partnerProgress.data.streak.current_streak : 0
  const streakTitle = getStreakTitle(streak)
  const weekData = READING_PLAN[viewWeek - 1]
  const isCurrentWeek = viewWeek === currentWeek
  const todayKey = new Date().toISOString().split('T')[0]
  const todayDOW = new Date().getDay()
  const todayDayIndex = (todayDOW === 0 || todayDOW === 6) ? null : todayDOW - 1
  const todayDone = isCurrentWeek && todayDayIndex !== null ? !!partnerProgress.data.readings[`w${viewWeek}_d${todayDayIndex}`]?.done : null
  const todayPrayers = partnerProgress.data.prayers[todayKey] || {}
  const weekReadings = weekData ? weekData.days.map(day => ({ ...day, done: !!partnerProgress.data.readings[`w${viewWeek}_d${day.dayIndex}`]?.done, verse: partnerProgress.data.verses[`w${viewWeek}_d${day.dayIndex}`] || '' })) : []
  const doneCount = weekReadings.filter(d => d.done).length
  const ssData = partnerProgress.data.ssProgress[`w${viewWeek}`] || {}
  const weeklyVerse = partnerProgress.data.weeklyVerses[`w${viewWeek}`] || ''

  // Partner avatar
  const partnerAvatarUrl = partner.avatar_url
  const PartnerAvatar = () => (
    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: partner.avatar_color || '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: partnerAvatarUrl?.startsWith('emoji:') ? '26px' : '20px', fontWeight: '600', flexShrink: 0, overflow: 'hidden' }}>
      {partnerAvatarUrl?.startsWith('emoji:') ? partnerAvatarUrl.replace('emoji:', '') : partnerAvatarUrl ? <img src={partnerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (partner.display_name || 'P')[0].toUpperCase()}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '20px 18px 16px', borderBottom: '0.5px solid #e8e6e2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PartnerAvatar />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a12' }}>{partner.display_name}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{streakTitle.emoji} {streakTitle.title} · {streak} day streak</div>
          </div>
          <button onClick={() => partnerProgress.refetch()} style={{ marginLeft: 'auto', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#888' }}>↺</button>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a12' }}>
            Week {viewWeek} {isCurrentWeek && <span style={{ fontSize: '11px', fontWeight: '500', background: '#1a3a0a', color: '#fff', padding: '2px 8px', borderRadius: '999px', marginLeft: '6px' }}>current</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button disabled={viewWeek <= 1} onClick={() => setViewWeek(v => v - 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '0.5px solid #d8d6d2', background: 'none', fontSize: '12px', color: viewWeek > 1 ? '#1a1a12' : '#ccc', cursor: viewWeek > 1 ? 'pointer' : 'not-allowed' }}>←</button>
            <button disabled={viewWeek >= currentWeek} onClick={() => setViewWeek(v => v + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '0.5px solid #d8d6d2', background: 'none', fontSize: '12px', color: viewWeek < currentWeek ? '#1a1a12' : '#ccc', cursor: viewWeek < currentWeek ? 'pointer' : 'not-allowed' }}>→</button>
          </div>
        </div>

        {isCurrentWeek && todayDone !== null && (
          <div style={{ background: todayDone ? '#EAF3DE' : '#FAEEDA', border: `0.5px solid ${todayDone ? '#97C459' : '#EF9F27'}`, borderRadius: '12px', padding: '11px 14px', fontSize: '13px', color: todayDone ? '#27500A' : '#633806' }}>
            {todayDone ? `✓ Reading done for today 🙌` : `○ Not yet read today — pray for ${partner.display_name}!`}
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
          {weekReadings.map(day => (
            <div key={day.dayIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: day.done ? '#1a3a0a' : '#f5f4f1', border: `0.5px solid ${day.done ? '#1a3a0a' : '#e8e6e2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: day.done ? '#fff' : '#888' }}>
                {day.done && <i className="ti ti-check" style={{ fontSize: '12px' }} aria-hidden="true" />}
              </div>
              <span style={{ fontSize: '9px', color: '#888' }}>{day.dayName.slice(0, 3)}</span>
            </div>
          ))}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FAEEDA', border: '0.5px solid #EF9F27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#854F0B' }}>SS</div>
            <span style={{ fontSize: '9px', color: '#888' }}>Sat</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>{doneCount} of {weekData?.days.length || 5} days this week</div>

        {weekReadings.some(d => d.verse) && (
          <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px 6px', fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.05em' }}>VERSES NOTED</div>
            {weekReadings.filter(d => d.verse).map(day => (
              <div key={day.dayIndex} style={{ padding: '8px 14px', borderTop: '0.5px solid #f0ede6' }}>
                <div style={{ fontSize: '10px', color: '#aaa', letterSpacing: '0.05em', marginBottom: '3px' }}>{day.dayName.toUpperCase()}</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#555', lineHeight: '1.5' }}>"{day.verse}"</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '14px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', marginBottom: '8px' }}>{isCurrentWeek ? 'MEMORISING THIS WEEK' : `WEEK ${viewWeek} MEMORISATION`}</div>
          {weeklyVerse ? <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#1a1a12', lineHeight: '1.6' }}>"{weeklyVerse}"</div> : <div style={{ fontSize: '13px', color: '#aaa' }}>Not set yet</div>}
        </div>

        {isCurrentWeek && (
          <>
            <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', marginBottom: '8px' }}>PRAYER TODAY</div>
              {[{ key: 'morning', label: 'Morning', icon: 'ti-sunrise', color: '#BA7517' }, { key: 'afternoon', label: 'Afternoon', icon: 'ti-sun', color: '#185FA5' }, { key: 'night', label: 'Evening', icon: 'ti-moon', color: '#534AB7' }].map(slot => (
                <div key={slot.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #f0ede6' }}>
                  <i className={`ti ${slot.icon}`} style={{ fontSize: '16px', color: slot.color, width: '20px' }} aria-hidden="true" />
                  <span style={{ flex: 1, fontSize: '13px', color: '#1a1a12' }}>{slot.label}</span>
                  <span style={{ fontSize: '13px', color: todayPrayers[slot.key] ? '#1a3a0a' : '#ccc', fontWeight: '500' }}>{todayPrayers[slot.key] ? '✓' : '–'}</span>
                </div>
              ))}
            </div>
            <NudgeButton fromUserId={currentUserId} fromName={myProfile?.display_name || 'your partner'} toUserId={partner.id} toName={partner.display_name} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Profile tab ────────────────────────────────────────────────────────────────
function ProfileTab({ profile, updateProfile, myProgress, signOut, setShowStreakPopup, setShowAvatarPicker, streakTitle, AvatarDisplay }) {
  const [name, setName] = useState(profile?.display_name || '')
  const [offering, setOffering] = useState(profile?.offering_amount || '')
  const streak = myProgress.data.streak.last_active_date ? myProgress.data.streak.current_streak : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '20px 18px 18px', borderBottom: '0.5px solid #e8e6e2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <AvatarDisplay size={60} fontSize={22} />
            <button onClick={() => setShowAvatarPicker(true)} style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', border: '0.5px solid #d8d6d2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="ti ti-pencil" style={{ fontSize: '11px', color: '#888' }} aria-hidden="true" />
            </button>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a12' }}>{profile?.display_name || 'User'}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{profile?.email || ''}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setShowStreakPopup(true)} style={{ background: '#1a2a12', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <span style={{ fontSize: '36px' }}>{streakTitle.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#C0DD97' }}>{streak} days</div>
            <div style={{ fontSize: '12px', color: '#639922', marginTop: '1px' }}>Current streak</div>
            <div style={{ display: 'inline-block', background: '#27500A', color: '#C0DD97', fontSize: '10px', fontWeight: '600', padding: '2px 9px', borderRadius: '999px', marginTop: '5px' }}>{streakTitle.title}</div>
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: '18px', color: '#3B6D11' }} aria-hidden="true" />
        </button>

        <NotificationSettings profile={profile} updateProfile={updateProfile} />

        <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '0.5px solid #f0ede6' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-coin" style={{ fontSize: '15px', color: '#BA7517' }} aria-hidden="true" />
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: '#1a1a12' }}>Sunday offering</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#BA7517', fontWeight: '600' }}>₦</span>
              <input type="number" value={offering} onChange={e => setOffering(e.target.value)} style={{ width: '70px', border: 'none', fontSize: '13px', color: '#888', background: 'transparent', outline: 'none', fontFamily: 'inherit', textAlign: 'right' }} />
              <button onClick={() => updateProfile({ offering_amount: Number(offering) })} style={{ fontSize: '11px', color: '#1a3a0a', background: 'none', border: '0.5px solid #1a3a0a', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#f5f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-user" style={{ fontSize: '15px', color: '#555' }} aria-hidden="true" />
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: '#1a1a12' }}>Display name</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '70px', border: 'none', fontSize: '13px', color: '#888', background: 'transparent', outline: 'none', fontFamily: 'inherit', textAlign: 'right' }} />
              <button onClick={() => updateProfile({ display_name: name })} style={{ fontSize: '11px', color: '#1a3a0a', background: 'none', border: '0.5px solid #1a3a0a', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '0.5px solid #f0ede6' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#f5f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-chart-bar" style={{ fontSize: '15px', color: '#555' }} aria-hidden="true" />
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: '#1a1a12' }}>Best streak</span>
            <span style={{ fontSize: '13px', color: '#888' }}>{myProgress.data.streak.longest_streak} days</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#f5f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-shield" style={{ fontSize: '15px', color: '#555' }} aria-hidden="true" />
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: '#1a1a12' }}>Privacy policy</span>
            <i className="ti ti-chevron-right" style={{ fontSize: '14px', color: '#ccc' }} aria-hidden="true" />
          </div>
        </div>

        <button onClick={signOut} style={{ width: '100%', padding: '14px', background: 'none', border: '0.5px solid #e8e6e2', borderRadius: '14px', color: '#A32D2D', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
          <i className="ti ti-logout" style={{ fontSize: '16px' }} aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
