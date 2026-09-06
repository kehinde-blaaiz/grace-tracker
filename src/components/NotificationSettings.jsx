import { useState, useEffect } from 'react'
import {
  requestPermission,
  getPermissionStatus,
  scheduleDailyReminders,
  clearAllScheduled,
} from '../lib/notifications'

export default function NotificationSettings({ profile, updateProfile }) {
  const [permission, setPermission] = useState(getPermissionStatus())
  const [requesting, setRequesting] = useState(false)
  const [saved, setSaved] = useState(false)

  const prayerTimes = {
    morning: profile?.prayer_morning ?? true,
    afternoon: profile?.prayer_afternoon ?? false,
    night: profile?.prayer_night ?? true,
  }

  const notificationsOn = profile?.notifications_enabled ?? false

  useEffect(() => {
    // Re-check permission on mount
    setPermission(getPermissionStatus())
  }, [])

  const handleToggleNotifications = async () => {
    if (!notificationsOn) {
      // Turning on — request permission first
      setRequesting(true)
      const result = await requestPermission()
      setPermission(result)
      setRequesting(false)

      if (result === 'granted') {
        await updateProfile({ notifications_enabled: true })
        scheduleDailyReminders(prayerTimes, profile?.display_name || 'friend')
      }
    } else {
      // Turning off
      await updateProfile({ notifications_enabled: false })
      clearAllScheduled()
    }
  }

  const handlePrayerToggle = async (slot) => {
    const updated = { ...prayerTimes, [slot]: !prayerTimes[slot] }
    await updateProfile({
      prayer_morning: updated.morning,
      prayer_afternoon: updated.afternoon,
      prayer_night: updated.night,
    })
    // Re-schedule with new times if notifications are on
    if (notificationsOn && permission === 'granted') {
      scheduleDailyReminders(updated, profile?.display_name || 'friend')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isUnsupported = permission === 'unsupported'
  const isDenied = permission === 'denied'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Main toggle */}
      <div style={{
        background: 'var(--surface-2)',
        borderRadius: '16px',
        border: '0.5px solid var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px',
          borderBottom: '0.5px solid var(--border)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: notificationsOn ? '#EAF3DE' : 'var(--surface-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="ti ti-bell" style={{ fontSize: '16px', color: notificationsOn ? '#2D5016' : 'var(--text-muted)' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
              Daily reminders
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {isUnsupported
                ? 'Not supported in this browser'
                : isDenied
                ? 'Blocked — enable in browser settings'
                : notificationsOn
                ? 'Notifications are on'
                : 'Get reminders to pray and read'}
            </div>
          </div>
          {!isUnsupported && !isDenied && (
            <button
              onClick={handleToggleNotifications}
              disabled={requesting}
              style={{
                width: '44px', height: '26px', borderRadius: '999px',
                background: notificationsOn ? '#2D5016' : 'var(--surface-1)',
                border: `0.5px solid ${notificationsOn ? '#2D5016' : 'var(--border-strong)'}`,
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                flexShrink: 0,
              }}
              aria-label="Toggle notifications"
            >
              <div style={{
                position: 'absolute',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff',
                top: '3px',
                left: notificationsOn ? '21px' : '3px',
                transition: 'left 0.2s',
              }} />
            </button>
          )}
        </div>

        {/* Prayer time schedule */}
        {notificationsOn && permission === 'granted' && (
          <>
            {[
              { key: 'morning',   label: 'Morning reminder',   sub: '6:30 AM',  icon: 'ti-sunrise',  color: '#BA7517', bg: '#FFF8ED' },
              { key: 'afternoon', label: 'Afternoon reminder',  sub: '1:00 PM',  icon: 'ti-sun',      color: '#185FA5', bg: '#E6F1FB' },
              { key: 'night',     label: 'Evening reminder',    sub: '8:00 PM',  icon: 'ti-moon',     color: '#534AB7', bg: '#F0EEF8' },
            ].map(slot => (
              <div key={slot.key} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                borderBottom: '0.5px solid var(--border)',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: slot.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={`ti ${slot.icon}`} style={{ fontSize: '15px', color: slot.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{slot.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{slot.sub}</div>
                </div>
                <button
                  onClick={() => handlePrayerToggle(slot.key)}
                  style={{
                    width: '40px', height: '22px', borderRadius: '999px',
                    background: prayerTimes[slot.key] ? '#2D5016' : 'var(--surface-1)',
                    border: `0.5px solid ${prayerTimes[slot.key] ? '#2D5016' : 'var(--border-strong)'}`,
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                  aria-label={`Toggle ${slot.label}`}
                >
                  <div style={{
                    position: 'absolute',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff',
                    top: '3px',
                    left: prayerTimes[slot.key] ? '21px' : '3px',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-info-circle" style={{ fontSize: '14px', color: 'var(--text-muted)' }} aria-hidden="true" />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Reminders arrive when the app is open in your browser. For notifications when the app is closed, a future update will add full push support.
              </div>
            </div>
          </>
        )}
      </div>

      {saved && (
        <div style={{
          background: '#EAF3DE', border: '0.5px solid #97C459',
          borderRadius: '12px', padding: '10px 14px',
          fontSize: '13px', color: '#27500A',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <i className="ti ti-check" style={{ fontSize: '14px' }} aria-hidden="true" />
          Schedule saved
        </div>
      )}
    </div>
  )
}
