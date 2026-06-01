import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'signup' && !displayName) { setError('Please enter your name.'); return }
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password, displayName)
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="cross-icon">✝</div>
          <h1>Grace & Growth</h1>
          <p>Spiritual accountability, together</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); setSuccess('') }}>Sign in</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Create account</button>
        </div>

        <div className="auth-form">
          {mode === 'signup' && (
            <input
              type="text"
              className="name-input"
              placeholder="Your name (e.g. Kenny)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          )}
          <input
            type="email"
            className="name-input"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="name-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in ✝' : 'Create account ✝'}
          </button>
        </div>

        <div className="login-verse">
          "As iron sharpens iron, so one person sharpens another." — Proverbs 27:17
        </div>
      </div>
    </div>
  )
}
