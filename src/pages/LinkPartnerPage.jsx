import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LinkPartnerPage() {
  const { profile, generateInviteCode, enterInviteCode, signOut } = useAuth()
  const [myCode, setMyCode] = useState(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [generating, setGenerating] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    const code = await generateInviteCode()
    setMyCode(code)
    setGenerating(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnter = async () => {
    if (!enteredCode.trim()) return
    setError('')
    setLinking(true)
    const result = await enterInviteCode(enteredCode)
    if (result.error) setError(result.error)
    setLinking(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f4f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '380px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>♡</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a12', marginBottom: '6px' }}>
            Link your accountability partner
          </div>
          <div style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}>
            Welcome, {profile?.display_name}. Share your code with your partner, or enter theirs to get started.
          </div>
        </div>

        {/* Generate my code */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '0.5px solid #e8e6e2', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a12', marginBottom: '4px' }}>
            Share your code
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.5' }}>
            Generate a 6-character code and send it to your partner.
          </div>

          {!myCode ? (
            <button onClick={handleGenerate} disabled={generating} style={{
              width: '100%', padding: '13px',
              background: '#1a3a0a', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '500',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
              {generating ? 'Generating…' : 'Generate my code'}
            </button>
          ) : (
            <div>
              <div style={{
                background: '#f5f4f1', borderRadius: '12px',
                padding: '16px', textAlign: 'center',
                marginBottom: '10px',
              }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a12', letterSpacing: '6px', fontFamily: 'monospace' }}>
                  {myCode}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  Valid for 48 hours
                </div>
              </div>
              <button onClick={handleCopy} style={{
                width: '100%', padding: '11px',
                background: copied ? '#EAF3DE' : 'transparent',
                border: `0.5px solid ${copied ? '#97C459' : '#e8e6e2'}`,
                borderRadius: '10px', fontSize: '13px',
                color: copied ? '#27500A' : '#555',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: '14px' }} aria-hidden="true" />
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#e8e6e2' }} />
          <span style={{ fontSize: '13px', color: '#aaa' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#e8e6e2' }} />
        </div>

        {/* Enter partner's code */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '0.5px solid #e8e6e2', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a12', marginBottom: '4px' }}>
            Enter your partner's code
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.5' }}>
            Ask your partner for their code and enter it here.
          </div>

          <input
            type="text"
            value={enteredCode}
            onChange={e => { setEnteredCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="e.g. A3BF9K"
            maxLength={6}
            style={{
              width: '100%', padding: '13px 14px',
              border: `0.5px solid ${error ? '#F09595' : '#e8e6e2'}`,
              borderRadius: '12px', fontSize: '18px',
              fontFamily: 'monospace', letterSpacing: '4px',
              textAlign: 'center', outline: 'none',
              background: '#f5f4f1', color: '#1a1a12',
              marginBottom: '10px',
            }}
            onKeyDown={e => e.key === 'Enter' && handleEnter()}
          />

          {error && (
            <div style={{ fontSize: '13px', color: '#A32D2D', marginBottom: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button onClick={handleEnter} disabled={!enteredCode.trim() || linking} style={{
            width: '100%', padding: '13px',
            background: enteredCode.trim().length === 6 ? '#1a3a0a' : '#e8e6e2',
            color: enteredCode.trim().length === 6 ? '#fff' : '#aaa',
            border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: '500',
            cursor: enteredCode.trim().length === 6 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}>
            {linking ? 'Linking…' : 'Link with partner'}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px', fontStyle: 'italic', lineHeight: '1.6' }}>
            "As iron sharpens iron, so one person sharpens another." — Proverbs 27:17
          </div>
          <button onClick={signOut} style={{
            background: 'none', border: 'none',
            fontSize: '13px', color: '#bbb',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
