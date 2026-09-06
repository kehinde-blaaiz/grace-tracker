import { useState, useEffect } from 'react'
import {
  requestPermission,
  getPermissionStatus,
  scheduleDailyReminders,
  clearAllScheduled,
} from '../lib/notifications'

export default function NotificationSettings({ profile, updateProfile, onSnack }) {
  const [permission, setPermission] = useState(getPermissionStatus())
  const [requesting, setRequesting] = useState(false)
  const [saved, setSaved] = useState(false)
  // Use local state so toggle works immediately even if DB column missing
  const [localOn, setLocalOn] = useState(profile?.notifications_enabled ?? false)

  const prayerTimes = {
    morning:   profile?.prayer_morning   ?? true,
    afternoon: profile?.prayer_afternoon ?? false,
    night:     profile?.prayer_night     ?? true,
  }

  useEffect(() => { setPermission(getPermissionStatus()) }, [])

  const handleToggle = async () => {
    if (requesting) return
    const turningOn = !localOn

    if (turningOn) {
      setRequesting(true)
      const result = await requestPermission()
      setPermission(result)
      setRequesting(false)
      setLocalOn(true)
      try { await updateProfile({ notifications_enabled: true }) } catch {}
      if (result === 'granted') {
        scheduleDailyReminders(prayerTimes, profile?.display_name || 'friend')
        onSnack?.('Reminders turned on')
      } else {
        onSnack?.('Allow notifications in browser settings')
      }
    } else {
      setLocalOn(false)
      try { await updateProfile({ notifications_enabled: false }) } catch {}
      clearAllScheduled()
      onSnack?.('Reminders turned off')
    }
  }

  const handlePrayerToggle = async (slot) => {
    const updated = { ...prayerTimes, [slot]: !prayerTimes[slot] }
    try {
      await updateProfile({
        prayer_morning:   updated.morning,
        prayer_afternoon: updated.afternoon,
        prayer_night:     updated.night,
      })
    } catch {}
    if (localOn && permission === 'granted') {
      scheduleDailyReminders(updated, profile?.display_name || 'friend')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isUnsupported = permission === 'unsupported'
  const isDenied = permission === 'denied'

  const Toggle = ({ isOn, onClick, size = 'lg' }) => {
    const w = size === 'lg' ? 48 : 44
    const h = size === 'lg' ? 28 : 26
    const thumbSize = size === 'lg' ? 22 : 20
    const thumbOn = w - thumbSize - 3
    return (
      <button
        onClick={onClick}
        aria-label="Toggle"
        style={{
          width: w, height: h, borderRadius: 999,
          background: isOn ? '#1a3a0a' : '#c0bdb8',
          border: 'none', padding: 0,
          cursor: 'pointer', position: 'relative',
          flexShrink: 0, outline: 'none',
          transition: 'background 0.2s',
          WebkitAppearance: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          width: thumbSize, height: thumbSize,
          borderRadius: '50%', background: '#fff',
          top: 3, left: isOn ? thumbOn : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e8e6e2', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: localOn ? '0.5px solid #f0ede6' : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: localOn ? '#EAF3DE' : '#f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            <i className="ti ti-bell" style={{ fontSize: 16, color: localOn ? '#1a3a0a' : '#aaa' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: '#1a1a12', fontWeight: 500 }}>Daily reminders</div>
            <div style={{ fontSize: 12, color: isDenied ? '#A32D2D' : '#888', marginTop: 1 }}>
              {isUnsupported   ? 'Not supported in this browser'
               : isDenied      ? 'Blocked — allow in browser settings'
               : requesting    ? 'Requesting permission…'
               : localOn       ? 'Reminders are on'
               :                 'Get reminders to pray and read'}
            </div>
          </div>
          {!isUnsupported && (
            <Toggle isOn={localOn} onClick={handleToggle} size="lg" />
          )}
        </div>

        {localOn && (
          <>
            {[
              { key: 'morning',   label: 'Morning reminder',   sub: '6:30 AM', icon: 'ti-sunrise', iconColor: '#BA7517', bg: '#FFF8ED' },
              { key: 'afternoon', label: 'Afternoon reminder',  sub: '1:00 PM', icon: 'ti-sun',     iconColor: '#185FA5', bg: '#E6F1FB' },
              { key: 'night',     label: 'Evening reminder',    sub: '8:00 PM', icon: 'ti-moon',    iconColor: '#534AB7', bg: '#F0EEF8' },
            ].map(slot => (
              <div key={slot.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid #f0ede6' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: slot.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${slot.icon}`} style={{ fontSize: 15, color: slot.iconColor }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#1a1a12' }}>{slot.label}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{slot.sub}</div>
                </div>
                <Toggle isOn={prayerTimes[slot.key]} onClick={() => handlePrayerToggle(slot.key)} size="sm" />
              </div>
            ))}

            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={`ti ${isDenied ? 'ti-alert-circle' : 'ti-info-circle'}`} style={{ fontSize: 13, color: isDenied ? '#A32D2D' : '#888', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ fontSize: 11, color: isDenied ? '#A32D2D' : '#888', lineHeight: 1.5 }}>
                {isDenied
                  ? 'Go to browser settings and allow notifications for this site.'
                  : 'Reminders arrive while your browser is open.'}
              </div>
            </div>
          </>
        )}
      </div>

      {saved && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#27500A', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden="true" /> Schedule saved
        </div>
      )}
    </div>
  )
}
