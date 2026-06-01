import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { READING_PLAN, getStreakTitle, SS_LESSON_URL } from '../data/readingPlan'
import WeekView from '../components/WeekView'
import PrayerTracker from '../components/PrayerTracker'
import FriendView from '../components/FriendView'
import OfferingTracker from '../components/OfferingTracker'
import StreakBadge from '../components/StreakBadge'

export default function Dashboard() {
  const { profile, signOut, getPartner, updateProfile, currentUserId } = useAuth()
  const partner = getPartner()

  const myProgress = useProgress(currentUserId)
  const partnerProgress = useProgress(partner?.id)

  const [activeTab, setActiveTab] = useState('today')
  const [currentWeek, setCurrentWeek] = useState(1)
  const [celebrateMsg, setCelebrateMsg] = useState('')

  useEffect(() => {
    try {
      let startDate = localStorage.getItem('grace_start_date')
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0]
        localStorage.setItem('grace_start_date', startDate)
      }
      const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
      const week = Math.max(1, Math.min(Math.floor(diff / 7) + 1, READING_PLAN.length))
      setCurrentWeek(week)
    } catch {
      setCurrentWeek(1)
    }
  }, [])

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayKey = new Date().toISOString().split('T')[0]
  const weekData = READING_PLAN[currentWeek - 1]
  const isSaturday = new Date().getDay() === 6
  const isSunday = new Date().getDay() === 0
  const todayDayIndex = (() => { const d = new Date().getDay(); return (d === 0 || d === 6) ? null : d - 1 })()
  const todayReading = todayDayIndex !== null && weekData ? weekData.days[todayDayIndex] : null
  const streakTitle = getStreakTitle(myProgress.data.streak.current_streak)

  const celebrate = (msg) => {
    setCelebrateMsg(msg)
    setTimeout(() => setCelebrateMsg(''), 3000)
  }

  const handleReadingCheck = (weekNum, dayIndex, done) => {
    myProgress.markReading(weekNum, dayIndex, done)
    if (done) celebrate('🎉 Reading marked! Keep it up!')
  }

  const prayerSlots = []
  if (profile?.prayer_morning) prayerSlots.push({ key: 'morning', label: 'Morning prayer', icon: '🌅' })
  if (profile?.prayer_afternoon) prayerSlots.push({ key: 'afternoon', label: 'Afternoon prayer', icon: '☀️' })
  if (profile?.prayer_night) prayerSlots.push({ key: 'night', label: 'Evening prayer', icon: '🌙' })

  if (myProgress.loading) {
    return <div className="loading-screen"><div className="loading-cross">✝</div><p>Loading…</p></div>
  }

  return (
    <div className="dashboard">
      {celebrateMsg && <div className="celebrate-toast">{celebrateMsg}</div>}

      <header className="dash-header">
        <div className="dash-header-left">
          <div className="user-avatar-sm" style={{ background: profile?.avatar_color || '#6b8c6e' }}>
            {(profile?.display_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="dash-greeting">
              {getTimeOfDay()}, {profile?.display_name || 'friend'}
            </div>
            <div className="dash-date">{todayDate}</div>
          </div>
        </div>
        <div className="dash-header-right">
          <StreakBadge streak={myProgress.data.streak.current_streak} title={streakTitle} lastActiveDate={myProgress.data.streak.last_active_date} />
          <button className="logout-btn" onClick={() => { myProgress.refetch(); partnerProgress.refetch() }} title="Refresh">↺</button>
          <button className="logout-btn" onClick={signOut} title="Sign out">⇄</button>
        </div>
      </header>

      <nav className="dash-tabs">
        {[
          { id: 'today', icon: '✦', label: 'Today' },
          { id: 'week', icon: '☰', label: 'This week' },
          { id: 'friend', icon: '♡', label: partner?.display_name || 'Partner' },
          { id: 'settings', icon: '⚙', label: 'Settings' },
        ].map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="dash-content">
        {activeTab === 'today' && weekData && (
          <TodayView
            todayReading={todayReading}
            isSaturday={isSaturday}
            isSunday={isSunday}
            weekData={weekData}
            myProgress={myProgress}
            todayKey={todayKey}
            prayerSlots={prayerSlots}
            onReadingCheck={handleReadingCheck}
            celebrate={celebrate}
            profile={profile}
          />
        )}
        {activeTab === 'week' && (weekData ? (
          <WeekView
            weekData={weekData}
            currentWeek={currentWeek}
            myProgress={myProgress}
            onWeekChange={setCurrentWeek}
            maxWeek={READING_PLAN.length}
            onReadingCheck={handleReadingCheck}
            celebrate={celebrate}
          />
        ) : <div className="no-reading-card"><p>Loading week data…</p></div>)}
        {activeTab === 'friend' && (
          <FriendView
            partner={partner}
            partnerProgress={partnerProgress}
            currentWeek={currentWeek}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView profile={profile} updateProfile={updateProfile} myProgress={myProgress} />
        )}
      </main>
    </div>
  )
}

function TodayView({ todayReading, isSaturday, isSunday, weekData, myProgress, todayKey, prayerSlots, onReadingCheck, celebrate, profile }) {
  const [verseNote, setVerseNote] = useState('')
  const [editingVerse, setEditingVerse] = useState(false)

  const readingKey = todayReading ? `w${weekData.weekNum}_d${todayReading.dayIndex}` : null
  const isDone = readingKey ? myProgress.data.readings[readingKey]?.done : false
  const savedVerse = readingKey ? myProgress.data.verses[readingKey] : ''
  const prayerData = myProgress.data.prayers[todayKey] || {}

  useEffect(() => { if (savedVerse) setVerseNote(savedVerse) }, [savedVerse])

  if (isSunday) return (
    <div className="today-view">
      <div className="sunday-card">
        <div className="sunday-icon">✝</div>
        <h2>Sunday Rest</h2>
        <p>It's the Lord's day. Rest, worship, and give thanks.</p>
        <p className="sunday-sub">Your progress is safe. See you tomorrow.</p>
      </div>
      <PrayerTracker slots={prayerSlots} data={prayerData} todayKey={todayKey} onMark={myProgress.markPrayer} celebrate={celebrate} />
      <OfferingTracker data={myProgress.data.offerings[todayKey]} todayKey={todayKey} onSave={myProgress.saveOffering} offeringAmount={profile?.offering_amount} />
    </div>
  )

  if (isSaturday) {
    const weeklyVerse = myProgress.data.weeklyVerses[`w${weekData.weekNum}`] || ''
    const ssData = myProgress.data.ssProgress[`w${weekData.weekNum}`] || {}
    return (
      <div className="today-view">
        <div className="today-section-label">Saturday — Review day</div>
        <div className="ss-card">
          <div className="ss-card-header">
            <span className="ss-label">Sunday school</span>
            <span className="ss-lesson-num">Lesson {weekData.ssLesson}</span>
          </div>
          <p className="ss-hint">Review today's lesson with your partner before Sunday.</p>
          <div className="ss-checks">
            <CheckItem label="I've read this week's lesson" done={ssData.lesson_read} onChange={v => { myProgress.markSSLesson(weekData.weekNum, 'lesson_read', v); if (v) celebrate('📖 Lesson read!') }} />
            <CheckItem label="Reviewed with partner ✓" done={ssData.lesson_reviewed} onChange={v => { myProgress.markSSLesson(weekData.weekNum, 'lesson_reviewed', v); if (v) celebrate('🤝 Review done!') }} />
          </div>
          <a href={SS_LESSON_URL} target="_blank" rel="noreferrer" className="ss-link">Open Sunday school library →</a>
        </div>
        <div className="verse-card">
          <div className="verse-card-label">Verse of the week — memorise this</div>
          <p className="verse-hint">Choose your favourite verse from this week's readings.</p>
          <textarea className="verse-textarea" placeholder="Type your favourite verse here…" value={weeklyVerse} onChange={e => myProgress.saveWeeklyVerse(weekData.weekNum, e.target.value)} rows={3} />
          {weeklyVerse && <div className="verse-saved-badge">✓ Saved</div>}
        </div>
        <PrayerTracker slots={prayerSlots} data={prayerData} todayKey={todayKey} onMark={myProgress.markPrayer} celebrate={celebrate} />
      </div>
    )
  }

  return (
    <div className="today-view">
      {todayReading ? (
        <>
          <div className="today-section-label">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })} — Week {weekData.weekNum}, SS Lesson {weekData.ssLesson}
          </div>
          <div className={`reading-card ${isDone ? 'done' : ''}`}>
            <div className="reading-card-top">
              <div className="reading-icon">{isDone ? '✓' : '📖'}</div>
              <div className="reading-info">
                <div className="reading-title">Today's reading</div>
                <div className="reading-passage">{todayReading.label}</div>
              </div>
              <button className={`check-btn ${isDone ? 'checked' : ''}`} onClick={() => onReadingCheck(weekData.weekNum, todayReading.dayIndex, !isDone)}>
                {isDone ? '✓ Done' : 'Mark done'}
              </button>
            </div>
            {todayReading.readSSLesson && (
              <div className="reading-extra-note">
                📚 Also start reading <a href={SS_LESSON_URL} target="_blank" rel="noreferrer">SS Lesson {weekData.ssLesson}</a> today
              </div>
            )}
          </div>

          <div className="verse-card">
            <div className="verse-card-label">One verse that caught your eye</div>
            {editingVerse || !savedVerse ? (
              <>
                <textarea className="verse-textarea" placeholder="e.g. Matthew 5:3 — Blessed are the poor in spirit…" value={verseNote} onChange={e => setVerseNote(e.target.value)} rows={3} />
                <button className="save-verse-btn" onClick={() => { myProgress.saveVerse(weekData.weekNum, todayReading.dayIndex, verseNote); setEditingVerse(false); celebrate('✨ Verse saved!') }}>Save verse</button>
              </>
            ) : (
              <div className="saved-verse-display">
                <p>"{savedVerse}"</p>
                <button className="edit-verse-btn" onClick={() => setEditingVerse(true)}>Edit</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-reading-card"><p>No reading assigned for today.</p></div>
      )}
      <PrayerTracker slots={prayerSlots} data={prayerData} todayKey={todayKey} onMark={myProgress.markPrayer} celebrate={celebrate} />
      <OfferingTracker data={myProgress.data.offerings[todayKey]} todayKey={todayKey} onSave={myProgress.saveOffering} offeringAmount={profile?.offering_amount} />
    </div>
  )
}

function CheckItem({ label, done, onChange }) {
  return (
    <label className={`check-item ${done ? 'checked' : ''}`}>
      <input type="checkbox" checked={!!done} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function SettingsView({ profile, updateProfile, myProgress }) {
  const [name, setName] = useState(profile?.display_name || '')
  const [offering, setOffering] = useState(profile?.offering_amount || '')
  const prayerTimes = { morning: profile?.prayer_morning, afternoon: profile?.prayer_afternoon, night: profile?.prayer_night }

  const togglePrayer = (slot) => updateProfile({ [`prayer_${slot}`]: !prayerTimes[slot] })

  return (
    <div className="settings-view">
      <div className="settings-section">
        <div className="settings-label">Prayer schedule</div>
        <p className="settings-hint">Which times will you commit to daily prayer?</p>
        <div className="prayer-toggles">
          {[{ key: 'morning', label: 'Morning', icon: '🌅' }, { key: 'afternoon', label: 'Afternoon', icon: '☀️' }, { key: 'night', label: 'Evening', icon: '🌙' }].map(slot => (
            <button key={slot.key} className={`prayer-toggle ${prayerTimes[slot.key] ? 'on' : ''}`} onClick={() => togglePrayer(slot.key)}>
              <span>{slot.icon}</span><span>{slot.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Sunday offering</div>
        <p className="settings-hint">Set a weekly offering amount as your commitment to God.</p>
        <div className="offering-input-row">
          <span className="currency-symbol">₦</span>
          <input type="number" className="offering-input" placeholder="0" value={offering} onChange={e => setOffering(e.target.value)} />
          <button className="save-offering-btn" onClick={() => updateProfile({ offering_amount: Number(offering) })}>Save</button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Display name</div>
        <div className="offering-input-row">
          <input type="text" className="offering-input" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
          <button className="save-offering-btn" onClick={() => updateProfile({ display_name: name })}>Save</button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Your streak</div>
        <div className="streak-stats">
          <div className="streak-stat">
            <div className="streak-stat-num">{myProgress.data.streak.current_streak}</div>
            <div className="streak-stat-label">Current streak</div>
          </div>
          <div className="streak-stat">
            <div className="streak-stat-num">{myProgress.data.streak.longest_streak}</div>
            <div className="streak-stat-label">Best streak</div>
          </div>
        </div>
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
