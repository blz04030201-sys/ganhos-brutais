import { supabase } from './supabase'

export const authService = {
  /** Register with email + password */
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return data
  },

  /** Login */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /** Logout */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /** Send password-reset email */
  async resetPassword(email) {
    const redirectTo = `${window.location.origin}/ganhos-brutais/`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  /** Update password (after reset link) */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  /** Get current session */
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  /** Subscribe to auth state changes */
  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return data.subscription
  },
}
