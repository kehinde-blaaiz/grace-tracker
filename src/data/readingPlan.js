export const OT_BOOKS = [
  { name: "Genesis", chapters: 50 },
  { name: "Exodus", chapters: 40 },
  { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 },
  { name: "Deuteronomy", chapters: 34 },
  { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 },
  { name: "Ruth", chapters: 4 },
  { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 },
  { name: "1 Kings", chapters: 22 },
  { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 },
  { name: "2 Chronicles", chapters: 36 },
  { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 },
  { name: "Esther", chapters: 10 },
  { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 },
  { name: "Proverbs", chapters: 31 },
  { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 },
  { name: "Isaiah", chapters: 66 },
  { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 },
  { name: "Ezekiel", chapters: 48 },
  { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 },
  { name: "Joel", chapters: 3 },
  { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 },
  { name: "Jonah", chapters: 4 },
  { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 },
  { name: "Habakkuk", chapters: 3 },
  { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 },
  { name: "Zechariah", chapters: 14 },
  { name: "Malachi", chapters: 4 },
]

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

export const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS]

export const SS_LESSON_BASE = 74
export const SS_LESSON_URL = "http://www.apostolicfaithweca.org/sunday-school-lesson-library"

// testament: 'ot' | 'nt' | 'both'
export function generatePlan(startBook = 'Mark', chaptersPerDay = 1, testament = 'nt') {
  let books
  if (testament === 'ot') books = OT_BOOKS
  else if (testament === 'nt') books = NT_BOOKS
  else books = ALL_BOOKS // both

  const startIdx = books.findIndex(b => b.name === startBook)
  const selectedBooks = startIdx >= 0 ? books.slice(startIdx) : books

  const allChapters = []
  selectedBooks.forEach(book => {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, chapter: ch })
    }
  })

  const weeks = []
  let idx = 0
  let weekNum = 1
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const readingsPerWeek = chaptersPerDay * 5

  while (idx < allChapters.length && weekNum <= 500) {
    const weekChapters = allChapters.slice(idx, idx + readingsPerWeek)
    if (!weekChapters.length) break

    const days = []
    for (let d = 0; d < 5; d++) {
      const dayChapters = weekChapters.slice(d * chaptersPerDay, (d + 1) * chaptersPerDay)
      if (!dayChapters.length) break
      const label = dayChapters.map(c => `${c.book} ${c.chapter}`).join(', ')
      days.push({ dayIndex: d, dayName: dayNames[d], chapters: dayChapters, label, readSSLesson: d === 4 })
    }

    weeks.push({ weekNum, ssLesson: SS_LESSON_BASE + weekNum - 1, days })
    idx += readingsPerWeek
    weekNum++
  }

  return weeks
}

export const READING_PLAN = generatePlan('Mark', 1, 'nt')

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
