import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProgress(userId) {
  const [data, setData] = useState({
    readings: {},
    verses: {},
    weeklyVerses: {},
    ssProgress: {},
    prayers: {},
    offerings: {},
    streak: { current_streak: 0, longest_streak: 0, last_active_date: null }
  })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [readings, verses, weekly, ss, prayers, offerings, streak] = await Promise.all([
      supabase.from('reading_progress').select('*').eq('user_id', userId),
      supabase.from('verse_notes').select('*').eq('user_id', userId),
      supabase.from('weekly_verses').select('*').eq('user_id', userId),
      supabase.from('ss_progress').select('*').eq('user_id', userId),
      supabase.from('prayer_log').select('*').eq('user_id', userId),
      supabase.from('offering_log').select('*').eq('user_id', userId),
      supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
    ])

    // Normalise into keyed objects for easy lookup
    const readingsMap = {}
    readings.data?.forEach(r => { readingsMap[`w${r.week_num}_d${r.day_index}`] = r })

    const versesMap = {}
    verses.data?.forEach(v => { versesMap[`w${v.week_num}_d${v.day_index}`] = v.verse_text })

    const weeklyMap = {}
    weekly.data?.forEach(v => { weeklyMap[`w${v.week_num}`] = v.verse_text })

    const ssMap = {}
    ss.data?.forEach(s => { ssMap[`w${s.week_num}`] = s })

    const prayersMap = {}
    prayers.data?.forEach(p => { prayersMap[p.log_date] = p })

    const offeringsMap = {}
    offerings.data?.forEach(o => { offeringsMap[o.log_date] = o })

    setData({
      readings: readingsMap,
      verses: versesMap,
      weeklyVerses: weeklyMap,
      ssProgress: ssMap,
      prayers: prayersMap,
      offerings: offeringsMap,
      streak: streak.data || { current_streak: 0, longest_streak: 0, last_active_date: null }
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const markReading = async (weekNum, dayIndex, done) => {
    const key = `w${weekNum}_d${dayIndex}`
    // Optimistic update
    setData(prev => ({
      ...prev,
      readings: { ...prev.readings, [key]: { ...prev.readings[key], done, week_num: weekNum, day_index: dayIndex } }
    }))

    await supabase.from('reading_progress').upsert({
      user_id: userId, week_num: weekNum, day_index: dayIndex, done, marked_at: new Date().toISOString()
    }, { onConflict: 'user_id,week_num,day_index' })

    if (done) updateStreak()
  }

  const saveVerse = async (weekNum, dayIndex, text) => {
    const key = `w${weekNum}_d${dayIndex}`
    setData(prev => ({ ...prev, verses: { ...prev.verses, [key]: text } }))
    await supabase.from('verse_notes').upsert({
      user_id: userId, week_num: weekNum, day_index: dayIndex, verse_text: text, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,week_num,day_index' })
  }

  const saveWeeklyVerse = async (weekNum, text) => {
    const key = `w${weekNum}`
    setData(prev => ({ ...prev, weeklyVerses: { ...prev.weeklyVerses, [key]: text } }))
    await supabase.from('weekly_verses').upsert({
      user_id: userId, week_num: weekNum, verse_text: text, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,week_num' })
  }

  const markSSLesson = async (weekNum, field, value) => {
    const key = `w${weekNum}`
    const existing = data.ssProgress[key] || {}
    const updated = { ...existing, [field]: value }
    setData(prev => ({ ...prev, ssProgress: { ...prev.ssProgress, [key]: updated } }))
    await supabase.from('ss_progress').upsert({
      user_id: userId, week_num: weekNum,
      lesson_read: updated.lesson_read || false,
      lesson_reviewed: updated.lesson_reviewed || false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,week_num' })
  }

  const markPrayer = async (date, slot, value) => {
    const existing = data.prayers[date] || {}
    const updated = { ...existing, [slot]: value }
    setData(prev => ({ ...prev, prayers: { ...prev.prayers, [date]: updated } }))
    await supabase.from('prayer_log').upsert({
      user_id: userId, log_date: date,
      morning: updated.morning || false,
      afternoon: updated.afternoon || false,
      night: updated.night || false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,log_date' })
  }

  const saveOffering = async (date, amount, given) => {
    setData(prev => ({ ...prev, offerings: { ...prev.offerings, [date]: { amount, given } } }))
    await supabase.from('offering_log').upsert({
      user_id: userId, log_date: date, amount, given, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,log_date' })
  }

  const updateStreak = async () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { last_active_date, current_streak, longest_streak } = data.streak

    let newCurrent = current_streak
    if (last_active_date === yesterday) newCurrent = current_streak + 1
    else if (last_active_date !== today) newCurrent = 1

    const newLongest = Math.max(longest_streak, newCurrent)
    setData(prev => ({ ...prev, streak: { current_streak: newCurrent, longest_streak: newLongest, last_active_date: today } }))
    await supabase.from('streaks').upsert({
      user_id: userId, current_streak: newCurrent, longest_streak: newLongest,
      last_active_date: today, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  }

  return { data, loading, markReading, saveVerse, saveWeeklyVerse, markSSLesson, markPrayer, saveOffering, refetch: fetchAll }
}
