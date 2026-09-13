import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const [pairs, setPairs] = useState([])
  const [solos, setSolos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_color, avatar_url, partner_id, last_seen, prayer_morning, prayer_night, notifications_enabled')
      .order('display_name')

    if (error || !data) { setLoading(false); return }

    // Build pairs (avoid showing same pair twice)
    const seen = new Set()
    const pairList = []
    const soloList = []

    data.forEach(user => {
      if (!user.partner_id) {
        soloList.push(user)
        return
      }
      const pairKey = [user.id, user.partner_id].sort().join('_')
      if (seen.has(pairKey)) return
      seen.add(pairKey)
      const partner = data.find(p => p.id === user.partner_id)
      pairList.push({ user, partner: partner || null })
    })

    setPairs(pairList)
    setSolos(soloList)
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getOnlineStatus = (last_seen) => {
    if (!last_seen) return { label: 'Never', color: '#bbb' }
    const mins = Math.floor((Date.now() - new Date(last_seen).getTime()) / 60000)
    if (mins < 5) return { label: 'Online', color: '#27500A' }
    if (mins < 60) return { label: `${mins}m ago`, color: '#888' }
    const hours = Math.floor(mins / 60)
    if (hours < 24) return { label: `${hours}h ago`, color: '#888' }
    return { label: `${Math.floor(hours / 24)}d ago`, color: '#bbb' }
  }

  const Avatar = ({ user, size = 40 }) => {
    const url = user?.avatar_url
    const initial = (user?.display_name || '?')[0].toUpperCase()
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: user?.avatar_color || '#2D5016', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: url?.startsWith('emoji:') ? size * 0.5 : size * 0.38, fontWeight: '600', overflow: 'hidden', flexShrink: 0 }}>
        {url?.startsWith('emoji:') ? url.replace('emoji:', '') : url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
      </div>
    )
  }

  const UserRow = ({ user }) => {
    const status = getOnlineStatus(user.last_seen)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <Avatar user={user} size={36} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: status.label === 'Online' ? '#2D5016' : '#ccc', border: '1.5px solid #fff' }} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a12' }}>{user.display_name || 'Unnamed'}</div>
          <div style={{ fontSize: '11px', color: status.color }}>{status.label}</div>
        </div>
      </div>
    )
  }

  const filtered = search.trim().toLowerCase()
  const filteredPairs = filtered ? pairs.filter(p =>
    p.user.display_name?.toLowerCase().includes(filtered) ||
    p.partner?.display_name?.toLowerCase().includes(filtered)
  ) : pairs
  const filteredSolos = filtered ? solos.filter(u => u.display_name?.toLowerCase().includes(filtered)) : solos

  const totalUsers = pairs.length * 2 + solos.length

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f1', fontFamily: '-apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1a2a12', padding: '20px 24px 16px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', color: '#639922', fontWeight: '600', letterSpacing: '0.08em', marginBottom: '4px' }}>GROW TOGETHER</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>Admin — Partners</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Total users', value: totalUsers },
              { label: 'Linked pairs', value: pairs.length },
              { label: 'Unlinked', value: solos.length },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px', flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#C0DD97' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#639922', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Search + Refresh */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '0.5px solid #e8e6e2', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none', color: '#1a1a12' }}
          />
          <button onClick={fetchData} style={{ padding: '10px 16px', background: '#1a3a0a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            ↺ Refresh
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '16px' }}>
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' }}>Loading…</div>
        ) : (
          <>
            {/* Linked pairs */}
            {filteredPairs.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  LINKED PAIRS ({filteredPairs.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredPairs.map(({ user, partner }) => (
                    <div key={user.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e6e2', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserRow user={user} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                          <div style={{ fontSize: '16px' }}>♡</div>
                          <div style={{ fontSize: '9px', color: '#1a3a0a', fontWeight: '600' }}>LINKED</div>
                        </div>
                        {partner ? <UserRow user={partner} /> : (
                          <div style={{ flex: 1, fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>Partner not found</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlinked users */}
            {filteredSolos.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  NOT YET LINKED ({filteredSolos.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredSolos.map(user => (
                    <div key={user.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #e8e6e2', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <UserRow user={user} />
                      <div style={{ fontSize: '11px', color: '#aaa', background: '#f5f4f1', padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>No partner</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPairs.length === 0 && filteredSolos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' }}>
                No users found{search ? ` matching "${search}"` : ''}.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
