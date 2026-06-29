import { supabase } from './supabase'

export const profileService = {
  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(userId, fields) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
