export const NT_BOOKS = [
  { name: "Matthew", chapters: 28 },
  { name: "Mark", chapters: 16 },
  { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 },
  { name: "Acts", chapters: 28 },
  { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 },
  { name: "2 Corinthians", chapters: 13 },
  { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 },
  { name: "Philippians", chapters: 4 },
  { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 },
  { name: "2 Thessalonians", chapters: 3 },
  { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 },
  { name: "Titus", chapters: 3 },
  { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 },
  { name: "James", chapters: 5 },
  { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 },
  { name: "1 John", chapters: 5 },
  { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 },
  { name: "Jude", chapters: 1 },
  { name: "Revelation", chapters: 22 },
]

export const SS_LESSON_BASE = 74
export const SS_LESSON_URL = "http://www.apostolicfaithweca.org/sunday-school-lesson-library"

export function generatePlan(startBook = 'Mark', chaptersPerDay = 1) {
  // Find starting index
  const startIdx = NT_BOOKS.findIndex(b => b.name === startBook)
  const books = startIdx >= 0 ? NT_BOOKS.slice(startIdx) : NT_BOOKS

  // Build flat list of all chapters from start book
  const allChapters = []
  books.forEach(book => {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, chapter: ch })
    }
  })

  const weeks = []
  let idx = 0
  let weekNum = 1
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const readingsPerWeek = chaptersPerDay * 5 // 5 weekdays

  while (idx < allChapters.length && weekNum <= 200) {
    const weekChapters = allChapters.slice(idx, idx + readingsPerWeek)
    if (!weekChapters.length) break

    // Group into 5 days
    const days = []
    for (let d = 0; d < 5; d++) {
      const dayChapters = weekChapters.slice(d * chaptersPerDay, (d + 1) * chaptersPerDay)
      if (!dayChapters.length) break
      const label = dayChapters.map(c => `${c.book} ${c.chapter}`).join(', ')
      days.push({
        dayIndex: d,
        dayName: dayNames[d],
        chapters: dayChapters,
        label,
        readSSLesson: d === 4,
      })
    }

    weeks.push({
      weekNum,
      ssLesson: SS_LESSON_BASE + weekNum - 1,
      days,
    })

    idx += readingsPerWeek
    weekNum++
  }

  return weeks
}

// Default plan (Mark, 1 chapter/day)
export const READING_PLAN = generatePlan('Mark', 1)

export const STREAK_TITLES = [
  { min: 0,   title: 'Seedling',  emoji: '🌱', color: '#639922' },
  { min: 3,   title: 'Sprout',    emoji: '🌿', color: '#3B6D11' },
  { min: 7,   title: 'Rooted',    emoji: '🌳', color: '#27500A' },
  { min: 14,  title: 'Fruitful',  emoji: '🍃', color: '#1a3a0a' },
  { min: 21,  title: 'Steadfast', emoji: '⚓', color: '#185FA5' },
  { min: 30,  title: 'Faithful',  emoji: '✨', color: '#854F0B' },
  { min: 60,  title: 'Devoted',   emoji: '🕊️', color: '#0F6E56' },
  { min: 90,  title: 'Warrior',   emoji: '🛡️', color: '#534AB7' },
  { min: 120, title: 'Overcomer', emoji: '👑', color: '#BA7517' },
]

export function getStreakTitle(days) {
  let current = STREAK_TITLES[0]
  for (const t of STREAK_TITLES) { if (days >= t.min) current = t }
  return current
}
