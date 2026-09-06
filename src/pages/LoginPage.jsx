import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'signup' && !displayName) { setError('Please enter your name.'); return }
    setLoading(true)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password, displayName)
      if (error) setError(error.message)
      else setSuccess('Account created! Sign in below.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '0.5px solid #e8e6e2',
    borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit',
    background: '#f5f4f1', outline: 'none', color: '#1a1a12',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '28px', padding: '40px 28px 32px', maxWidth: '380px', width: '100%', border: '0.5px solid #e8e6e2' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#0d0d0a', marginBottom: '16px', overflow: 'hidden' }}>
            <img src="/grace-logo.png" alt="Grace and Growth" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a12', marginBottom: '4px' }}>Grace & Growth</div>
          <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>Your companion for today.</div>
        </div>

        <div style={{ display: 'flex', border: '0.5px solid #e8e6e2', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          {['signin', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '10px', border: 'none',
              background: mode === m ? '#1a3a0a' : 'transparent',
              color: mode === m ? '#fff' : '#888',
              fontFamily: 'inherit', fontSize: '14px',
              fontWeight: mode === m ? '500' : '400', cursor: 'pointer',
            }}>
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {mode === 'signup' && <input type="text" placeholder="Your name (e.g. Kenny)" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
        </div>

        {error && <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: '#791F1F', marginBottom: '12px' }}>{error}</div>}
        {success && <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: '#27500A', marginBottom: '12px' }}>{success}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? '#639922' : '#1a3a0a',
          color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px',
          fontWeight: '500', fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '0.5px solid #f0ede6', textAlign: 'center', fontSize: '12px', color: '#aaa', fontStyle: 'italic', lineHeight: '1.6' }}>
          "As iron sharpens iron, so one person sharpens another." — Proverbs 27:17
        </div>
      </div>
    </div>
  )
}
