import { supabase } from './supabase'

const SCHEDULE_KEY = 'grace_notification_schedule'

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function sendNotification(title, body) {
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/grace-logo.png' })
}

export function scheduleDailyReminders(prayerTimes, userName = 'friend') {
  clearAllScheduled()
  const slots = []
  if (prayerTimes?.morning)   slots.push({ slot: 'morning',   hour: 6,  min: 30 })
  if (prayerTimes?.afternoon) slots.push({ slot: 'afternoon', hour: 13, min: 0  })
  if (prayerTimes?.night)     slots.push({ slot: 'night',     hour: 20, min: 0  })

  const schedule = slots.map(s => ({ ...s, nextFireMs: nextOccurrence(s.hour, s.min) }))
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
  armScheduledNotifications(userName)
}

function nextOccurrence(hour, min) {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, min, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime()
}

export function armScheduledNotifications(userName = 'friend') {
  const raw = localStorage.getItem(SCHEDULE_KEY)
  if (!raw) return
  let schedule
  try { schedule = JSON.parse(raw) } catch { return }

  const labels = { morning: 'Morning prayer', afternoon: 'Afternoon prayer', night: 'Evening prayer' }
  const now = Date.now()

  schedule.forEach(entry => {
    let fireAt = entry.nextFireMs
    while (fireAt <= now) fireAt += 86400000
    setTimeout(() => {
      sendNotification(`Time to pray, ${userName} 🙏`, `${labels[entry.slot]} — open Grace & Growth to log it.`)
      const updated = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
      const idx = updated.findIndex(e => e.slot === entry.slot)
      if (idx !== -1) { updated[idx].nextFireMs = fireAt + 86400000; localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated)) }
    }, fireAt - now)
  })
}

export function clearAllScheduled() {
  localStorage.removeItem(SCHEDULE_KEY)
}

export async function nudgePartner(fromUserId, fromName, toUserId) {
  const { error } = await supabase.from('nudges').insert({
    from_user_id: fromUserId, to_user_id: toUserId,
    message: `${fromName} is praying for you today 🙏`,
    sent_at: new Date().toISOString(), read: false,
  })
  return !error
}

export async function checkIncomingNudges(userId, onNudge) {
  if (!userId) return
  const { data } = await supabase.from('nudges').select('*').eq('to_user_id', userId).eq('read', false).order('sent_at', { ascending: false })
  if (!data || data.length === 0) return
  onNudge(data[0])
  await supabase.from('nudges').update({ read: true }).eq('to_user_id', userId).eq('read', false)
}
