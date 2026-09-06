import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const AVATAR_COLORS = ['#2D5016', '#085041', '#185FA5', '#854F0B', '#534AB7']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setPartner(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    if (data?.partner_id) loadPartner(data.partner_id)
    else setLoading(false)
    // Update last_seen immediately on load
    supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId)
  }

  // Heartbeat — update last_seen every 3 minutes while app is open
  useEffect(() => {
    if (!session?.user?.id) return
    const interval = setInterval(() => {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', session.user.id)
    }, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  const loadPartner = async (partnerId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()
    setPartner(data || null)
    setLoading(false)
  }

  const signUp = async (email, password, displayName) => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName } }
    })
    if (!error) {
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').update({
            display_name: displayName,
            avatar_color: color,
          }).eq('id', user.id)
          loadProfile(user.id)
        }
      }, 1000)
    }
    return { error }
  }

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => { await supabase.auth.signOut() }

  const updateProfile = async (updates) => {
    if (!session) return
    // Optimistic update — show change immediately
    setProfile(prev => ({ ...prev, ...updates }))
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) {
      setProfile(data)
      if (data.partner_id && data.partner_id !== profile?.partner_id) {
        loadPartner(data.partner_id)
      }
    }
  }

  // Generate a 6-character invite code and store it
  const generateInviteCode = async () => {
    if (!session) return null
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase.from('invite_codes').insert({
      code,
      created_by: session.user.id,
    })
    if (error) return null
    return code
  }

  // Enter a partner's invite code to link up
  const enterInviteCode = async (code) => {
    if (!session) return { error: 'Not signed in' }

    const trimmed = code.trim().toUpperCase()

    // Find the code
    const { data: invite, error: fetchError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', trimmed)
      .eq('used', false)
      .single()

    if (fetchError || !invite) return { error: 'Code not found or already used.' }
    if (invite.created_by === session.user.id) return { error: "That's your own code — share it with your partner." }

    const now = new Date()
    if (new Date(invite.expires_at) < now) return { error: 'This code has expired. Ask your partner to generate a new one.' }

    // Link both profiles to each other
    const partnerId = invite.created_by
    const myId = session.user.id

    const [r1, r2] = await Promise.all([
      supabase.from('profiles').update({ partner_id: partnerId }).eq('id', myId),
      supabase.from('profiles').update({ partner_id: myId }).eq('id', partnerId),
    ])

    if (r1.error || r2.error) return { error: 'Something went wrong. Please try again.' }

    // Mark code as used
    await supabase.from('invite_codes').update({ used: true }).eq('code', trimmed)

    // Reload profile and partner so UI updates immediately
    await loadProfile(myId)
    return { success: true }
  }

  // Unlink from partner
  const unlinkPartner = async () => {
    if (!session || !profile?.partner_id) return
    await Promise.all([
      supabase.from('profiles').update({ partner_id: null }).eq('id', session.user.id),
      supabase.from('profiles').update({ partner_id: null }).eq('id', profile.partner_id),
    ])
    setPartner(null)
    setProfile(prev => ({ ...prev, partner_id: null }))
  }

  const getPartner = () => partner

  return (
    <AuthContext.Provider value={{
      session, profile, loading,
      partner, getPartner,
      signUp, signIn, signOut,
      updateProfile,
      generateInviteCode,
      enterInviteCode,
      unlinkPartner,
      currentUserId: session?.user?.id || null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
