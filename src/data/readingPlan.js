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
  { name: "Revelation", chapters: 22 }
];

export const SS_LESSON_BASE = 74;
export const SS_LESSON_URL = "http://www.apostolicfaithweca.org/sunday-school-lesson-library?llang=All&slc=All&title=&Slno=&page=15";

function generatePlan() {
  const allChapters = [];
  NT_BOOKS.forEach(book => {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, chapter: ch });
    }
  });

  const weeks = [];
  let chapterIndex = 0;
  let weekNum = 1;

  while (chapterIndex < allChapters.length) {
    const weekChapters = allChapters.slice(chapterIndex, chapterIndex + 10);
    if (weekChapters.length === 0) break;

    const days = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let d = 0; d < 5; d++) {
      const start = d * 2;
      const end = Math.min(start + 2, weekChapters.length);
      const chs = weekChapters.slice(start, end);
      if (chs.length > 0) {
        days.push({
          dayIndex: d,
          dayName: dayNames[d],
          chapters: chs,
          readSSLesson: d === 4,
          label: chs.map(c => `${c.book} ${c.chapter}`).join(", ")
        });
      }
    }

    weeks.push({
      weekNum,
      ssLesson: SS_LESSON_BASE + weekNum - 1,
      days
    });

    chapterIndex += Math.min(10, weekChapters.length);
    weekNum++;
    if (weekNum > 130) break;
  }

  return weeks;
}

export const READING_PLAN = generatePlan();

export const STREAK_TITLES = [
  { min: 0, title: "Seedling", emoji: "🌱", color: "#7c9e6a" },
  { min: 3, title: "Sprout", emoji: "🌿", color: "#5a8a4a" },
  { min: 7, title: "Rooted", emoji: "🌳", color: "#4a7a3a" },
  { min: 14, title: "Fruitful", emoji: "🍃", color: "#3a6e5a" },
  { min: 21, title: "Steadfast", emoji: "⚓", color: "#5a6e9e" },
  { min: 30, title: "Faithful", emoji: "✨", color: "#8a6e4a" },
  { min: 60, title: "Devoted", emoji: "🕊️", color: "#9e7a5a" },
  { min: 90, title: "Warrior", emoji: "🛡️", color: "#6a5a8a" },
  { min: 120, title: "Overcomer", emoji: "👑", color: "#b8963e" },
];

export function getStreakTitle(streakDays) {
  let current = STREAK_TITLES[0];
  for (const t of STREAK_TITLES) {
    if (streakDays >= t.min) current = t;
  }
  return current;
}
