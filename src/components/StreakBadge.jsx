export default function StreakBadge({ streak, title, lastActiveDate }) {
  const display = lastActiveDate ? streak : 0
  return (
    <div className="streak-badge" title={`${display} day streak`}>
      <span className="streak-emoji">{title.emoji}</span>
      <div className="streak-info">
        <span className="streak-num">{display}</span>
        <span className="streak-title">{title.title}</span>
      </div>
    </div>
  )
}
