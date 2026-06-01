import { getStreakTitle, READING_PLAN } from '../data/readingPlan'

export default function FriendView({ partner, partnerProgress, currentWeek }) {
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

  const streak = partnerProgress.data.streak.current_streak
  const streakTitle = getStreakTitle(streak)
  const weekData = READING_PLAN[currentWeek - 1]
  const todayKey = new Date().toISOString().split('T')[0]
  const todayPrayers = partnerProgress.data.prayers[todayKey] || {}

  const weekReadings = weekData ? weekData.days.map(day => ({
    ...day,
    done: partnerProgress.data.readings[`w${currentWeek}_d${day.dayIndex}`]?.done || false
  })) : []

  const doneCount = weekReadings.filter(d => d.done).length

  const todayDayIndex = (() => { const d = new Date().getDay(); return (d === 0 || d === 6) ? null : d - 1 })()
  const todayDone = todayDayIndex !== null
    ? !!(partnerProgress.data.readings[`w${currentWeek}_d${todayDayIndex}`]?.done)
    : null

  const ssData = partnerProgress.data.ssProgress[`w${currentWeek}`] || {}

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

      <div className="friend-section-label">Today's reading</div>
      <div className={`friend-status-card ${todayDone === true ? 'done' : todayDone === false ? 'pending' : 'rest'}`}>
        {todayDone === true && <span>✓ Reading done for today 🙌</span>}
        {todayDone === false && <span>○ Not yet read today — pray for them!</span>}
        {todayDone === null && <span>Rest day</span>}
      </div>

      <div className="friend-section-label">This week's progress</div>
      <div className="friend-week-progress">
        {weekReadings.map(day => (
          <div key={day.dayIndex} className={`friend-day-dot ${day.done ? 'done' : ''}`}>
            <div className="dot-circle">{day.done ? '✓' : ''}</div>
            <div className="dot-label">{day.dayName.slice(0, 3)}</div>
          </div>
        ))}
        <div className="friend-day-dot">
          <div className={`dot-circle ${ssData.lesson_reviewed ? 'sat done' : 'sat'}`}>
            {ssData.lesson_reviewed ? '✓' : 'S'}
          </div>
          <div className="dot-label">Sat</div>
        </div>
      </div>
      <div className="friend-week-count">{doneCount}/{weekData?.days.length || 5} days this week</div>

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

      <div className="friend-verse-section">
        <div className="friend-section-label">This week's verse they're memorising</div>
        {partnerProgress.data.weeklyVerses[`w${currentWeek}`] ? (
          <div className="friend-verse-card">"{partnerProgress.data.weeklyVerses[`w${currentWeek}`]}"</div>
        ) : (
          <p className="muted">Not set yet</p>
        )}
      </div>

      <div className="accountability-prompt">
        <p>💬 Encourage {partner.display_name} today — reach out and let them know you're praying for them.</p>
      </div>
    </div>
  )
}
