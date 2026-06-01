import { SS_LESSON_URL } from '../data/readingPlan';

export default function WeekView({ weekData, currentWeek, myProgress, onWeekChange, maxWeek, onReadingCheck, celebrate }) {
  const { days, ssLesson, weekNum } = weekData;
  const ssData = myProgress.data.ssLessons[`week${weekNum}`] || {};

  const weekReadings = days.map(day => ({
    ...day,
    done: myProgress.data.readings[`week${weekNum}_day${day.dayIndex}`]?.done || false,
    verse: myProgress.data.verses[`week${weekNum}_day${day.dayIndex}`] || '',
  }));

  const doneCount = weekReadings.filter(d => d.done).length;
  const progress = Math.round((doneCount / days.length) * 100);

  const weeklyVerse = myProgress.data.weeklyVerse[`week${weekNum}`] || '';

  return (
    <div className="week-view">
      <div className="week-nav">
        <button
          className="week-nav-btn"
          disabled={currentWeek <= 1}
          onClick={() => onWeekChange(currentWeek - 1)}
        >←</button>
        <div className="week-title">
          <span>Week {weekNum}</span>
          <span className="ss-badge">SS Lesson {ssLesson}</span>
        </div>
        <button
          className="week-nav-btn"
          disabled={currentWeek >= maxWeek}
          onClick={() => onWeekChange(currentWeek + 1)}
        >→</button>
      </div>

      <div className="week-progress-bar">
        <div className="week-progress-fill" style={{ width: `${progress}%` }} />
        <span className="week-progress-label">{doneCount}/{days.length} days read</span>
      </div>

      <div className="week-days">
        {weekReadings.map(day => (
          <div key={day.dayIndex} className={`week-day-card ${day.done ? 'done' : ''}`}>
            <div className="week-day-header">
              <div className="week-day-name">{day.dayName}</div>
              <button
                className={`small-check-btn ${day.done ? 'checked' : ''}`}
                onClick={() => onReadingCheck(weekNum, day.dayIndex, !day.done)}
              >
                {day.done ? '✓' : '○'}
              </button>
            </div>
            <div className="week-day-passage">{day.label}</div>
            {day.readSSLesson && (
              <div className="week-ss-note">📚 Start SS Lesson {ssLesson}</div>
            )}
            {day.verse && (
              <div className="week-day-verse">"{day.verse}"</div>
            )}
          </div>
        ))}

        <div className="week-day-card saturday-card">
          <div className="week-day-header">
            <div className="week-day-name">Saturday</div>
            <div className="sat-checks">
              <span className={`mini-badge ${ssData.read ? 'done' : ''}`}>
                {ssData.read ? '✓' : '○'} lesson read
              </span>
              <span className={`mini-badge ${ssData.reviewed ? 'done' : ''}`}>
                {ssData.reviewed ? '✓' : '○'} reviewed
              </span>
            </div>
          </div>
          <div className="week-day-passage">SS Lesson review + verse memorisation</div>
          {weeklyVerse && (
            <div className="week-day-verse weekly-verse">
              <span className="weekly-verse-label">Memorised: </span>
              "{weeklyVerse}"
            </div>
          )}
        </div>
      </div>

      <div className="ss-section">
        <a href={SS_LESSON_URL} target="_blank" rel="noreferrer" className="ss-link-full">
          📖 Open Sunday school lesson library →
        </a>
      </div>
    </div>
  );
}
