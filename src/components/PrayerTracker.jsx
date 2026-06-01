export default function PrayerTracker({ slots, data, todayKey, onMark, celebrate }) {
  if (slots.length === 0) return null;

  const allDone = slots.every(s => data[s.key]);
  const doneCnt = slots.filter(s => data[s.key]).length;

  return (
    <div className="prayer-tracker">
      <div className="prayer-tracker-header">
        <span className="tracker-label">Prayer today</span>
        <span className="tracker-count">{doneCnt}/{slots.length}</span>
      </div>
      <div className="prayer-slots">
        {slots.map(slot => (
          <button
            key={slot.key}
            className={`prayer-slot-btn ${data[slot.key] ? 'done' : ''}`}
            onClick={() => {
              const newVal = !data[slot.key];
              onMark(todayKey, slot.key, newVal);
              if (newVal) celebrate('🙏 Prayer marked!');
            }}
          >
            <span className="prayer-slot-icon">{slot.icon}</span>
            <span className="prayer-slot-label">{slot.label}</span>
            <span className="prayer-slot-check">{data[slot.key] ? '✓' : '○'}</span>
          </button>
        ))}
      </div>
      {allDone && <div className="all-done-msg">All prayers done today! 🙌</div>}
    </div>
  );
}
