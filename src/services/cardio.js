import { supabase } from './supabase'

// Tipos de cardio sugeridos + ícone (compartilhado entre ExList, LogSession e o Dashboard)
export const CARDIO_TYPES = [
  { key:'Esteira',       icon:'🏃' },
  { key:'Escada',        icon:'🪜' },
  { key:'Bicicleta',     icon:'🚴' },
  { key:'Elíptico',      icon:'🌀' },
  { key:'Caminhada',     icon:'🚶' },
  { key:'Corrida',       icon:'🏃‍♂️' },
  { key:'Personalizado', icon:'⏱️' },
]
export const cardioIcon = (type) => CARDIO_TYPES.find(t => t.key === type)?.icon || '⏱️'

/**
 * CARDIO v2 — referência fixa por treino + registro por sessão.
 *
 * cardio_configs  → a "referência" do cardio daquele treino (criada na aba
 *                    do treino, igual a um exercício). Fica fixa até o
 *                    usuário editar ou apagar. Campos: type, duration_min,
 *                    intensity, distance_km, calories, notes, position
 *                    ('antes' | 'depois' do treino), sort_order.
 *
 * cardio_logs     → o que foi realmente feito em cada data, ligado a uma
 *                    cardio_config. Pré-preenchido a partir da referência,
 *                    mas pode divergir (tempo/intensidade daquele dia).
 *                    Um registro por (cardio_config_id, log_date).
 */

// ── Referência (config) ──────────────────────────────────────
export const cardioConfigService = {
  async listByWorkout(workoutId) {
    const { data, error } = await supabase
      .from('cardio_configs')
      .select('*')
      .eq('workout_id', workoutId)
      .order('position')
      .order('sort_order')
    if (error) throw error
    return data || []
  },

  async create(userId, workoutId, fields) {
    const { data, error } = await supabase
      .from('cardio_configs')
      .insert({
        user_id:      userId,
        workout_id:   workoutId,
        type:         fields.type || 'Personalizado',
        duration_min: fields.duration_min ? parseInt(fields.duration_min) : null,
        intensity:    fields.intensity || null,
        distance_km:  fields.distance_km ? parseFloat(fields.distance_km) : null,
        calories:     fields.calories ? parseInt(fields.calories) : null,
        notes:        fields.notes || null,
        position:     fields.position === 'antes' ? 'antes' : 'depois',
        sort_order:   fields.sort_order || 0,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('cardio_configs')
      .update({
        type:         fields.type,
        duration_min: fields.duration_min ? parseInt(fields.duration_min) : null,
        intensity:    fields.intensity || null,
        distance_km:  fields.distance_km ? parseFloat(fields.distance_km) : null,
        calories:     fields.calories ? parseInt(fields.calories) : null,
        notes:        fields.notes || null,
        position:     fields.position === 'antes' ? 'antes' : 'depois',
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('cardio_configs').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Registro por sessão (log) ────────────────────────────────
export const cardioService = {
  /** Todos os configs de um treino já com o log daquele dia (se existir) anexado em `.today`. */
  async listByWorkoutDate(workoutId, date) {
    const configs = await cardioConfigService.listByWorkout(workoutId)
    if (!configs.length) return []
    const ids = configs.map(c => c.id)
    const { data, error } = await supabase
      .from('cardio_logs')
      .select('*')
      .in('cardio_config_id', ids)
      .eq('log_date', date)
    if (error) throw error
    const byConfig = {}
    ;(data || []).forEach(l => { byConfig[l.cardio_config_id] = l })
    return configs.map(c => ({ ...c, today: byConfig[c.id] || null }))
  },

  /** Último registro salvo para essa referência antes de uma data (histórico). */
  async getLast(configId, beforeDate) {
    let q = supabase
      .from('cardio_logs')
      .select('*')
      .eq('cardio_config_id', configId)
      .order('log_date', { ascending: false })
      .limit(1)
    if (beforeDate) q = q.lt('log_date', beforeDate)
    const { data, error } = await q
    if (error) throw error
    return data?.[0] || null
  },

  /** Cria ou atualiza o registro do dia para essa referência (upsert manual). */
  async upsert(userId, configId, date, fields) {
    const { data: existing, error: findErr } = await supabase
      .from('cardio_logs')
      .select('id')
      .eq('cardio_config_id', configId)
      .eq('log_date', date)
      .maybeSingle()
    if (findErr) throw findErr

    const payload = {
      type:         fields.type || null,
      duration_min: fields.duration_min ? parseInt(fields.duration_min) : null,
      intensity:    fields.intensity || null,
      distance_km:  fields.distance_km ? parseFloat(fields.distance_km) : null,
      calories:     fields.calories ? parseInt(fields.calories) : null,
      notes:        fields.notes || null,
    }

    if (existing) {
      const { data, error } = await supabase
        .from('cardio_logs')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('cardio_logs')
      .insert({ user_id: userId, cardio_config_id: configId, log_date: date, ...payload })
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
