export default function StreakBadge({ streak, title }) {
  return (
    <div className="streak-badge" title={`${streak} day streak`}>
      <span className="streak-emoji">{title.emoji}</span>
      <div className="streak-info">
        <span className="streak-num">{streak}</span>
        <span className="streak-title">{title.title}</span>
      </div>
    </div>
  );
}
