import { supabase } from './supabase'

// ── DIET GOALS ───────────────────────────────────────────────
export const dietGoalsService = {
  async get(userId) {
    const { data } = await supabase
      .from('diet_goals')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data || { calories: 2800, protein: 180, carbs: 350, fat: 80 }
  },

  async upsert(userId, goals) {
    const { data, error } = await supabase
      .from('diet_goals')
      .upsert({ user_id: userId, ...goals, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── MEAL PLANS ───────────────────────────────────────────────
export const mealPlanService = {
  async getActive(userId) {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data
  },

  async create(userId, name = 'Minha Dieta') {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({ user_id: userId, name, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── MEALS ────────────────────────────────────────────────────
export const mealService = {
  async listByPlan(planId) {
    const { data, error } = await supabase
      .from('meals')
      .select('*, meal_items(*)')
      .eq('plan_id', planId)
      .order('sort_order')
    if (error) throw error
    return (data || []).map(m => ({
      ...m,
      items: (m.meal_items || []).sort((a, b) => a.sort_order - b.sort_order),
    }))
  },

  async create(planId, userId, fields) {
    const { data, error } = await supabase
      .from('meals')
      .insert({ plan_id: planId, user_id: userId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('meals')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (error) throw error
  },

  async reorder(ids) {
    await Promise.all(ids.map((id, i) =>
      supabase.from('meals').update({ sort_order: i }).eq('id', id)
    ))
  },
}

// ── MEAL ITEMS ───────────────────────────────────────────────
export const mealItemService = {
  async addItem(mealId, userId, item) {
    const { data, error } = await supabase
      .from('meal_items')
      .insert({ meal_id: mealId, user_id: userId, ...item })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('meal_items')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('meal_items').delete().eq('id', id)
    if (error) throw error
  },

  async replaceItems(mealId, userId, items) {
    await supabase.from('meal_items').delete().eq('meal_id', mealId)
    if (!items.length) return []
    const rows = items.map((item, i) => ({
      meal_id: mealId,
      user_id: userId,
      ...item,
      sort_order: i,
    }))
    const { data, error } = await supabase.from('meal_items').insert(rows).select()
    if (error) throw error
    return data || []
  },
}

// ── CUSTOM FOODS ─────────────────────────────────────────────
export const foodService = {
  async listCustom(userId) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (error) throw error
    return data || []
  },

  async create(userId, food) {
    const { data, error } = await supabase
      .from('foods')
      .insert({ user_id: userId, is_custom: true, ...food })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('foods')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (error) throw error
  },
}

// ── BODY MEASUREMENTS ────────────────────────────────────────
export const measurementService = {
  async list(userId) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId, fields) {
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({ user_id: userId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('body_measurements')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('body_measurements').delete().eq('id', id)
    if (error) throw error
  },
}
