import { supabase } from './supabase'

/**
 * Cardio logs — each record belongs to a workout session (workout_id + log_date).
 *
 * Table: cardio_logs
 *   id          uuid PK
 *   user_id     uuid FK → auth.users
 *   workout_id  uuid FK → workouts
 *   log_date    date
 *   type        text        (Esteira, Escada, Bicicleta, Elíptico, Caminhada, Corrida, Personalizado)
 *   duration    integer     (minutes)
 *   intensity   text        (free-form: "Velocidade 6", "Carga 8", etc.)
 *   distance    numeric     (km, optional)
 *   calories    integer     (optional)
 *   notes       text        (optional)
 *   created_at  timestamptz
 */

export const cardioService = {

  /** List all cardio logs for a specific workout on a specific date */
  async listByWorkoutAndDate(workoutId, date) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('log_date', date)
      .order('created_at')
    if (error) throw error
    return data || []
  },

  /** Get the last cardio session for a workout (for showing history) */
  async getLastByWorkout(workoutId, beforeDate) {
    const q = supabase
      .from('cardio_logs')
      .select('*')
      .eq('workout_id', workoutId)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (beforeDate) q.lt('log_date', beforeDate)
    const { data, error } = await q.limit(10)
    if (error) throw error
    return data || []
  },

  /** Get all cardio logs for a workout (for future graphs) */
  async listAllByWorkout(workoutId) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('workout_id', workoutId)
      .order('log_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId, workoutId, date, fields) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .insert({
        user_id:    userId,
        workout_id: workoutId,
        log_date:   date,
        type:       fields.type        || 'Personalizado',
        duration:   parseInt(fields.duration)  || 0,
        intensity:  fields.intensity   || '',
        distance:   parseFloat(fields.distance) || null,
        calories:   parseInt(fields.calories)   || null,
        notes:      fields.notes       || null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .update({
        type:      fields.type,
        duration:  parseInt(fields.duration)  || 0,
        intensity: fields.intensity   || '',
        distance:  parseFloat(fields.distance) || null,
        calories:  parseInt(fields.calories)   || null,
        notes:     fields.notes       || null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('cardio_logs').delete().eq('id', id)
    if (error) throw error
  },
}
