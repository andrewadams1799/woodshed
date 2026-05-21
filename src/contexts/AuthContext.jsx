import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const CACHE_KEY = 'woodshed_cache'

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? null } catch { return null }
}

function writeCache(user, profile) {
  if (user) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId: user.id, email: user.email, profile }))
  } else {
    localStorage.removeItem(CACHE_KEY)
  }
}

export function AuthProvider({ children }) {
  const cache = readCache()
  const cachedUser = cache ? { id: cache.userId, email: cache.email } : null

  const [user,    setUser]    = useState(cachedUser)
  const [profile, setProfile] = useState(cache?.profile ?? null)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let done = false

    function finish(authUser, authProfile) {
      if (done) return
      done = true
      setUser(authUser)
      setProfile(authProfile)
      if (authUser) writeCache(authUser, authProfile)
      else writeCache(null, null)
      setLoading(false)
    }

    // Timeout: if auth hangs for 6 seconds, just show login
    const timeout = setTimeout(() => finish(null, null), 6000)

    // Primary: getSession resolves quickly from localStorage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (!session?.user) { finish(null, null); return }
      const p = await fetchProfile(session.user.id)
      finish(session.user, p)
    }).catch(() => { clearTimeout(timeout); finish(null, null) })

    // Secondary: onAuthStateChange handles sign-in/sign-out after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!done) return // let getSession() handle the initial state
        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          const p = await fetchProfile(authUser.id)
          setProfile(p)
          writeCache(authUser, p)
        } else {
          setProfile(null)
          writeCache(null, null)
        }
      }
    )

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data ?? null
    } catch {
      return null
    }
  }

  async function signOut() {
    writeCache(null, null)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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
    writeCache(user, data)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, createProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
