import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../services/supabase'
import { authService } from '../services/auth'
import { profileService } from '../services/profile'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session,    setSession]    = useState(null)
  const [profile,    setProfile]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [toastMsg,   setToastMsg]   = useState(null)
  const toastTimer = useRef(null)

  // Accent color (persisted in profile)
  const accentColor = profile?.accent_color || '#3B82F6'

  // Apply accent CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-override', accentColor)
  }, [accentColor])

  // ── Auth ──
  useEffect(() => {
    authService.getSession().then(s => {
      setSession(s)
      if (s?.user) loadProfile(s.user.id)
      else setLoading(false)
    })

    const sub = authService.onAuthChange(s => {
      setSession(s)
      if (s?.user) loadProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => sub.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    try {
      const p = await profileService.get(uid)
      setProfile(p)
    } catch (e) {
      console.error('Profile load error', e)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    const p = await profileService.get(session.user.id)
    setProfile(p)
  }, [session])

  // ── Toast ──
  const toast = useCallback((msg, duration = 2200) => {
    clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), duration)
  }, [])

  const value = {
    session,
    user: session?.user || null,
    userId: session?.user?.id || null,
    profile,
    refreshProfile,
    loading,
    toast,
    toastMsg,
    accentColor,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)
