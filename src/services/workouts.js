import { supabase } from './supabase'

// ── GYMS ─────────────────────────────────────────────────────
export const gymService = {
  async list(userId) {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order')
    if (error) throw error
    return data || []
  },

  async create(userId, fields) {
    const { data, error } = await supabase
      .from('gyms')
      .insert({ user_id: userId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('gyms')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('gyms').delete().eq('id', id)
    if (error) throw error
  },

  async reorder(ids) {
    const updates = ids.map((id, i) =>
      supabase.from('gyms').update({ sort_order: i }).eq('id', id)
    )
    await Promise.all(updates)
  },
}

// ── WORKOUTS ─────────────────────────────────────────────────
export const workoutService = {
  async listByGym(gymId) {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('gym_id', gymId)
      .order('sort_order')
    if (error) throw error
    return data || []
  },

  async create(userId, gymId, fields) {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: userId, gym_id: gymId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('workouts')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) throw error
  },
}

// ── EXERCISES ────────────────────────────────────────────────
export const exerciseService = {
  async listByWorkout(workoutId) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('sort_order')
    if (error) throw error
    return data || []
  },

  async create(userId, workoutId, fields) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ user_id: userId, workout_id: workoutId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('exercises')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) throw error
  },

  async reorder(ids) {
    await Promise.all(ids.map((id, i) =>
      supabase.from('exercises').update({ sort_order: i }).eq('id', id)
    ))
  },
}

// ── LOGS & SETS ──────────────────────────────────────────────
export const logService = {
  /** Get the most recent log's full set list for each exercise in a batch — used to
   *  preview every valid set from the last execution directly on the exercise list,
   *  without opening the log screen. */
  async listLatestByExerciseIds(exerciseIds) {
    if (!exerciseIds || !exerciseIds.length) return {}
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('exercise_id, log_date, exercise_sets(weight, reps, set_number)')
      .in('exercise_id', exerciseIds)
      .order('log_date', { ascending: false })
    if (error) throw error
    const map = {}
    for (const log of data || []) {
      if (map[log.exercise_id]) continue // already have the newest (rows came ordered desc)
      const sets = (log.exercise_sets || []).filter(s => s.weight || s.reps).sort((a, b) => a.set_number - b.set_number)
      if (sets.length) map[log.exercise_id] = { sets, weight: sets[0].weight, reps: sets[0].reps, log_date: log.log_date }
    }
    return map
  },

  /** Get the best (PR) weight×reps ever logged for each exercise in a batch — used to
   *  show "PR" alongside the last session directly on the exercise list. */
  async listPRsByExerciseIds(exerciseIds) {
    if (!exerciseIds || !exerciseIds.length) return {}
    const { data, error } = await supabase
      .from('exercise_sets')
      .select('weight, reps, exercise_logs!inner(exercise_id)')
      .in('exercise_logs.exercise_id', exerciseIds)
    if (error) throw error
    const map = {}
    for (const row of data || []) {
      const exId = row.exercise_logs?.exercise_id
      const w = parseFloat(row.weight) || 0
      if (!exId || !w) continue
      if (!map[exId] || w > map[exId].weight) map[exId] = { weight: w, reps: row.reps }
    }
    return map
  },

  /** Get all logs for a given exercise, newest first */
  async listByExercise(exerciseId) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*, exercise_sets(*)')
      .eq('exercise_id', exerciseId)
      .order('log_date', { ascending: false })
    if (error) throw error
    return (data || []).map(log => ({
      ...log,
      sets: (log.exercise_sets || []).sort((a, b) => a.set_number - b.set_number),
    }))
  },

  /** Get logs for a user on a specific date (for dashboard) */
  async listByDate(userId, date) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*, exercises(name, workout_id), exercise_sets(*)')
      .eq('user_id', userId)
      .eq('log_date', date)
    if (error) throw error
    return (data || []).map(log => ({
      ...log,
      sets: (log.exercise_sets || []).sort((a, b) => a.set_number - b.set_number),
    }))
  },

  /** Upsert a log entry (create or update) */
  async upsertLog(userId, exerciseId, date, observation) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .upsert(
        { user_id: userId, exercise_id: exerciseId, log_date: date, observation },
        { onConflict: 'exercise_id,log_date' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Replace all sets for a log */
  async replaceSets(logId, userId, sets) {
    // Delete existing
    await supabase.from('exercise_sets').delete().eq('log_id', logId)
    if (!sets.length) return []

    // PR detection (is_pr) is computed by the caller before this runs, using
    // the exercise's full history — see WorkoutsScreen's save().
    const rows = sets.map((s, i) => ({
      log_id: logId,
      user_id: userId,
      set_number: i + 1,
      weight: parseFloat(s.weight) || null,
      reps: s.reps || '',
      is_pr: s.is_pr || false,
    }))
    const { data, error } = await supabase
      .from('exercise_sets')
      .insert(rows)
      .select()
    if (error) throw error
    return data || []
  },

  async deleteLog(logId) {
    const { error } = await supabase.from('exercise_logs').delete().eq('id', logId)
    if (error) throw error
  },
}
