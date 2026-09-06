// Browser push notification service for Grace & Growth
// Works when browser is open. For true push (closed browser),
// Firebase Cloud Messaging would be needed as a future upgrade.

import { supabase } from './supabase'

// ─── Permission ──────────────────────────────────────────────────────────────

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// ─── Send a notification immediately ─────────────────────────────────────────

export function sendNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  })
}

// ─── Schedule daily reminders ─────────────────────────────────────────────────
// We store scheduled timeouts in localStorage and re-arm them on app load.
// They fire if the browser/tab is open at the scheduled time.

const SCHEDULE_KEY = 'grace_notification_schedule'

export function scheduleDailyReminders(prayerTimes, userName = 'friend') {
  // Clear any existing scheduled alarms
  clearAllScheduled()

  const slots = []
  if (prayerTimes?.morning)   slots.push({ slot: 'morning',   hour: 6,  min: 30, label: 'Morning prayer' })
  if (prayerTimes?.afternoon) slots.push({ slot: 'afternoon', hour: 13, min: 0,  label: 'Afternoon prayer' })
  if (prayerTimes?.night)     slots.push({ slot: 'night',     hour: 20, min: 0,  label: 'Evening prayer' })

  const schedule = slots.map(s => ({
    ...s,
    nextFireMs: nextOccurrence(s.hour, s.min),
  }))

  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
  armScheduledNotifications(userName)
  return schedule
}

function nextOccurrence(hour, min) {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, min, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime()
}

// Called on every app load — re-arms any stored schedule
export function armScheduledNotifications(userName = 'friend') {
  const raw = localStorage.getItem(SCHEDULE_KEY)
  if (!raw) return

  let schedule
  try { schedule = JSON.parse(raw) } catch { return }

  const now = Date.now()

  schedule.forEach(entry => {
    // If the time already passed today, push to tomorrow
    let fireAt = entry.nextFireMs
    while (fireAt <= now) fireAt += 24 * 60 * 60 * 1000

    const delay = fireAt - now
    setTimeout(() => {
      sendNotification(
        `Time to pray, ${userName} 🙏`,
        `${entry.label} — open Grace & Growth to log it.`
      )
      // Re-arm for tomorrow
      const updated = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
      const idx = updated.findIndex(e => e.slot === entry.slot)
      if (idx !== -1) {
        updated[idx].nextFireMs = fireAt + 24 * 60 * 60 * 1000
        localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated))
      }
    }, delay)
  })
}

export function clearAllScheduled() {
  localStorage.removeItem(SCHEDULE_KEY)
}

// ─── Reading reminder ─────────────────────────────────────────────────────────

export function scheduleReadingReminder(userName = 'friend', hourOfDay = 8) {
  const delay = nextOccurrence(hourOfDay, 0) - Date.now()
  setTimeout(() => {
    sendNotification(
      `Daily reading, ${userName} 📖`,
      `Open Grace & Growth to read today's chapter.`
    )
  }, delay)
}

// ─── Partner nudge ────────────────────────────────────────────────────────────
// Stores a nudge record in Supabase so the partner picks it up on next load.

export async function nudgePartner(fromUserId, fromName, toUserId) {
  const { error } = await supabase.from('nudges').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    message: `${fromName} is praying for you today 🙏`,
    sent_at: new Date().toISOString(),
    read: false,
  })
  return !error
}

// Called on app load — checks if any unread nudges exist for the current user
export async function checkIncomingNudges(userId, onNudge) {
  if (!userId) return

  const { data } = await supabase
    .from('nudges')
    .select('*')
    .eq('to_user_id', userId)
    .eq('read', false)
    .order('sent_at', { ascending: false })

  if (!data || data.length === 0) return

  // Show the most recent unread nudge
  const nudge = data[0]
  onNudge(nudge)

  // Mark all as read
  await supabase
    .from('nudges')
    .update({ read: true })
    .eq('to_user_id', userId)
    .eq('read', false)
}
