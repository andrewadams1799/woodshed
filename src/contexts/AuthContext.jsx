import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let settled = false

    // If auth hasn't resolved in 8 seconds, clear the session and show login
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      supabase.auth.signOut()
      setLoading(false)
    }, 8000)

    function resolve(session) {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut()
        resolve(null)
      } else {
        resolve(session)
      }
    }).catch(() => resolve(null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )
    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email) {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function createProfile(name, color) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, name, color })
    if (insertError) return { error: insertError }

    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (selectError) return { error: selectError }

    setProfile(data)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, createProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
