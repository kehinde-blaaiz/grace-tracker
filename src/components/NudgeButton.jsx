import { useState } from 'react'
import { nudgePartner } from '../lib/notifications'

export default function NudgeButton({ fromUserId, fromName, toUserId, toName, onSent }) {
  const [state, setState] = useState('idle')

  const handleNudge = async () => {
    if (state === 'sent') return
    setState('sending')
    const ok = await nudgePartner(fromUserId, fromName, toUserId)
    setState(ok ? 'sent' : 'error')
    if (ok) {
      onSent?.()
      setTimeout(() => setState('idle'), 5000)
    }
  }

  return (
    <div style={{ marginTop: '4px' }}>
      <button onClick={handleNudge} disabled={state === 'sending' || state === 'sent'} style={{
        width: '100%', padding: '13px 16px', borderRadius: '14px',
        background: state === 'sent' ? '#EAF3DE' : '#1a3a0a',
        border: state === 'sent' ? '0.5px solid #97C459' : 'none',
        color: state === 'sent' ? '#27500A' : '#fff',
        fontSize: '14px', fontWeight: '500', cursor: state === 'sent' ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        {state === 'idle' && <><i className="ti ti-hand-finger" style={{ fontSize: '16px' }} aria-hidden="true" /> Nudge {toName}</>}
        {state === 'sending' && <>Sending...</>}
        {state === 'sent' && <><i className="ti ti-check" style={{ fontSize: '16px' }} aria-hidden="true" /> Nudge sent</>}
        {state === 'error' && <>Couldn't send — try again</>}
      </button>
      {state === 'idle' && (
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Sends {toName} a notification that you're praying for her
        </div>
      )}
    </div>
  )
}
