import { useState } from 'react'

export default function OfferingTracker({ data, todayKey, onSave, offeringAmount }) {
  const isSunday = new Date().getDay() === 0
  if (!isSunday) return null

  const [amount, setAmount] = useState(data?.amount || offeringAmount || '')
  const given = data?.given || false

  return (
    <div className="offering-tracker">
      <div className="tracker-label">Sunday offering</div>
      <div className="offering-row">
        <span className="currency-symbol">₦</span>
        <input type="number" className="offering-input-sm" value={amount} onChange={e => setAmount(e.target.value)} placeholder={offeringAmount || '0'} />
        <button className={`offering-given-btn ${given ? 'done' : ''}`} onClick={() => onSave(todayKey, Number(amount), !given)}>
          {given ? '✓ Given' : 'Mark as given'}
        </button>
      </div>
      {given && <div className="offering-done-msg">Thank you, God sees your heart 🙏</div>}
    </div>
  )
}
