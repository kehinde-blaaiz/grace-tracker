export const NT_BOOKS = [
  { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 },
  { name: "Romans", chapters: 16 }, { name: "1 Corinthians", chapters: 16 },
  { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 },
  { name: "Colossians", chapters: 4 }, { name: "1 Thessalonians", chapters: 5 },
  { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 },
  { name: "Philemon", chapters: 1 }, { name: "Hebrews", chapters: 13 },
  { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 },
  { name: "2 John", chapters: 1 }, { name: "3 John", chapters: 1 },
  { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 },
]

export const SS_LESSON_BASE = 74
export const SS_LESSON_URL = "http://www.apostolicfaithweca.org/sunday-school-lesson-library?llang=All&slc=All&title=&Slno=&page=15"

function generatePlan() {
  const allChapters = []
  NT_BOOKS.forEach(book => { for (let ch = 1; ch <= book.chapters; ch++) allChapters.push({ book: book.name, chapter: ch }) })

  const weeks = []
  let idx = 0, weekNum = 1
  const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday"]

  while (idx < allChapters.length) {
    const wc = allChapters.slice(idx, idx + 5)
    if (!wc.length) break
    weeks.push({
      weekNum, ssLesson: SS_LESSON_BASE + weekNum - 1,
      days: wc.map((ch, d) => ({ dayIndex: d, dayName: dayNames[d], chapter: ch, label: `${ch.book} ${ch.chapter}`, readSSLesson: d === 4 }))
    })
    idx += wc.length
    weekNum++
    if (weekNum > 200) break
  }
  return weeks
}

export const READING_PLAN = generatePlan()

export const STREAK_TITLES = [
  { min: 0,   title: "Seedling",  emoji: "🌱", color: "#639922" },
  { min: 3,   title: "Sprout",    emoji: "🌿", color: "#3B6D11" },
  { min: 7,   title: "Rooted",    emoji: "🌳", color: "#27500A" },
  { min: 14,  title: "Fruitful",  emoji: "🍃", color: "#1a3a0a" },
  { min: 21,  title: "Steadfast", emoji: "⚓", color: "#185FA5" },
  { min: 30,  title: "Faithful",  emoji: "✨", color: "#854F0B" },
  { min: 60,  title: "Devoted",   emoji: "🕊️", color: "#0F6E56" },
  { min: 90,  title: "Warrior",   emoji: "🛡️", color: "#534AB7" },
  { min: 120, title: "Overcomer", emoji: "👑", color: "#BA7517" },
]

export function getStreakTitle(days) {
  let current = STREAK_TITLES[0]
  for (const t of STREAK_TITLES) { if (days >= t.min) current = t }
  return current
}
