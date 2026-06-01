import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const AVATAR_COLORS = ['#7c6fa0', '#4a8a7c', '#c4943a', '#8a6e4a', '#6b8c6e']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
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
    loadAllProfiles()
    setLoading(false)
  }

  const loadAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setAllProfiles(data)
  }

  const signUp = async (email, password, displayName) => {
    const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: displayName },
      }
    })
    if (!error) {
      // Update avatar color after signup
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').update({
            display_name: displayName,
            avatar_color: AVATAR_COLORS[colorIndex]
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

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates) => {
    if (!session) return
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) setProfile(data)
  }

  const getPartner = () => {
    if (!profile) return null
    return allProfiles.find(p => p.id !== profile.id) || null
  }

  return (
    <AuthContext.Provider value={{
      session, profile, loading,
      allProfiles, getPartner,
      signUp, signIn, signOut, updateProfile,
      currentUserId: session?.user?.id || null
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
