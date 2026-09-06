import { useState, useEffect } from 'react'

export default function NudgeToast({ nudge, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss?.() }, 6000)
    return () => clearTimeout(t)
  }, [])

  if (!visible || !nudge) return null

  return (
    <div style={{
      position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, width: 'calc(100% - 32px)', maxWidth: '420px',
      background: '#1a3a0a', borderRadius: '16px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2D5016', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="ti ti-heart" style={{ fontSize: '18px', color: '#97C459' }} aria-hidden="true" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>You've been nudged</div>
        <div style={{ fontSize: '12px', color: '#97C459', marginTop: '2px' }}>{nudge.message}</div>
      </div>
      <button onClick={() => { setVisible(false); onDismiss?.() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#639922', padding: '4px' }} aria-label="Dismiss">
        <i className="ti ti-x" style={{ fontSize: '16px' }} aria-hidden="true" />
      </button>
    </div>
  )
}
