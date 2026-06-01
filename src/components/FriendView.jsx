import { useState } from 'react'
import { getStreakTitle, READING_PLAN } from '../data/readingPlan'

export default function FriendView({ partner, partnerProgress, currentWeek }) {
  const [viewWeek, setViewWeek] = useState(currentWeek)

  if (!partner) {
    return (
      <div className="friend-view">
        <div className="no-partner-card">
          <div className="sunday-icon">♡</div>
          <h3>No partner yet</h3>
          <p>Once your friend creates an account, they'll appear here automatically.</p>
          <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>You both need to sign up with your own email addresses.</p>
        </div>
      </div>
    )
  }

  if (partnerProgress.loading) return <div className="friend-view"><p className="muted">Loading partner data…</p></div>

  const lastActiveDate = partnerProgress.data.streak.last_active_date
  const streak = lastActiveDate ? partnerProgress.data.streak.current_streak : 0
  const streakTitle = getStreakTitle(streak)
  const weekData = READING_PLAN[viewWeek - 1]
  const todayKey = new Date().toISOString().split('T')[0]
  const todayPrayers = partnerProgress.data.prayers[todayKey] || {}
  const isCurrentWeek = viewWeek === currentWeek

  const weekReadings = weekData ? weekData.days.map(day => ({
    ...day,
    done: partnerProgress.data.readings[`w${viewWeek}_d${day.dayIndex}`]?.done || false,
    verse: partnerProgress.data.verses[`w${viewWeek}_d${day.dayIndex}`] || '',
  })) : []

  const doneCount = weekReadings.filter(d => d.done).length
  const ssData = partnerProgress.data.ssProgress[`w${viewWeek}`] || {}
  const weeklyVerse = partnerProgress.data.weeklyVerses[`w${viewWeek}`] || ''

  const todayDayIndex = (() => { const d = new Date().getDay(); return (d === 0 || d === 6) ? null : d - 1 })()
  const todayDone = isCurrentWeek && todayDayIndex !== null
    ? !!(partnerProgress.data.readings[`w${viewWeek}_d${todayDayIndex}`]?.done)
    : null

  return (
    <div className="friend-view">
      <div className="friend-header">
        <div className="friend-avatar" style={{ background: partner.avatar_color || '#4a8a7c' }}>
          {(partner.display_name || 'F')[0].toUpperCase()}
        </div>
        <div>
          <div className="friend-name">{partner.display_name}</div>
          <div className="friend-streak">{streakTitle.emoji} {streakTitle.title} — {streak} day streak</div>
        </div>
      </div>

      <div className="week-nav" style={{ marginTop: '0.25rem' }}>
        <button className="week-nav-btn" disabled={viewWeek <= 1} onClick={() => setViewWeek(v => v - 1)}>←</button>
        <div className="week-title">
          <span>Week {viewWeek}</span>
          <span className="ss-badge">SS Lesson {weekData?.ssLesson}</span>
          {isCurrentWeek && <span className="current-week-pill">current</span>}
        </div>
        <button className="week-nav-btn" disabled={viewWeek >= currentWeek} onClick={() => setViewWeek(v => v + 1)}>→</button>
      </div>

      {isCurrentWeek && (
        <>
          <div className="friend-section-label">Today's reading</div>
          <div className={`friend-status-card ${todayDone === true ? 'done' : todayDone === false ? 'pending' : 'rest'}`}>
            {todayDone === true && <span>✓ Reading done for today 🙌</span>}
            {todayDone === false && <span>○ Not yet read today — pray for them!</span>}
            {todayDone === null && <span>Rest day</span>}
          </div>
        </>
      )}

      <div className="friend-section-label">
        {isCurrentWeek ? "This week's progress" : `Week ${viewWeek} progress`}
      </div>
      <div className="friend-week-progress">
        {weekReadings.map(day => (
          <div key={day.dayIndex} className={`friend-day-dot ${day.done ? 'done' : ''}`}>
            <div className="dot-circle">{day.done ? '✓' : ''}</div>
            <div className="dot-label">{day.dayName.slice(0, 3)}</div>
          </div>
        ))}
        <div className="friend-day-dot">
          <div className={`dot-circle ${ssData.lesson_reviewed ? 'done' : 'sat'}`}>
            {ssData.lesson_reviewed ? '✓' : 'S'}
          </div>
          <div className="dot-label">Sat</div>
        </div>
      </div>
      <div className="friend-week-count">{doneCount}/{weekData?.days.length || 5} days this week</div>

      {weekReadings.some(d => d.verse) && (
        <>
          <div className="friend-section-label">Verses noted this week</div>
          <div className="friend-verses-list">
            {weekReadings.filter(d => d.verse).map(day => (
              <div key={day.dayIndex} className="friend-verse-item">
                <span className="friend-verse-day">{day.dayName}</span>
                <span className="friend-verse-text">"{day.verse}"</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="friend-verse-section">
        <div className="friend-section-label">
          {isCurrentWeek ? "This week's verse they're memorising" : `Week ${viewWeek} memorisation verse`}
        </div>
        {weeklyVerse ? (
          <div className="friend-verse-card">"{weeklyVerse}"</div>
        ) : (
          <p className="muted">Not set yet</p>
        )}
      </div>

      {isCurrentWeek && (
        <>
          <div className="friend-section-label">Prayer today</div>
          <div className="friend-prayer-row">
            {[{ key: 'morning', label: 'Morning', icon: '🌅' }, { key: 'afternoon', label: 'Afternoon', icon: '☀️' }, { key: 'night', label: 'Evening', icon: '🌙' }].map(slot => (
              <div key={slot.key} className={`friend-prayer-dot ${todayPrayers[slot.key] ? 'done' : ''}`}>
                <span>{slot.icon}</span>
                <span className="prayer-dot-label">{slot.label}</span>
                <span className="prayer-dot-status">{todayPrayers[slot.key] ? '✓' : '–'}</span>
              </div>
            ))}
          </div>
          <div className="accountability-prompt">
            <p>💬 Encourage {partner.display_name} today — reach out and let them know you're praying for them.</p>
          </div>
        </>
      )}
    </div>
  )
}
