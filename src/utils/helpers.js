export const todayISO = () => new Date().toISOString().split('T')[0]
export const todayLabel = () => new Date().toLocaleDateString('pt-BR')
export const dayNow = () => ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][new Date().getDay()]

/** True if a workout's day_label (e.g. "Segunda-feira") matches today's weekday */
export function matchesToday(dayLabel) {
  if (!dayLabel) return false
  const today = dayNow().toLowerCase()
  return dayLabel.toLowerCase().startsWith(today)
}

/** Pick the workout scheduled for today out of a list, falling back to the first one */
export function pickTodaysWorkout(workouts = []) {
  if (!workouts.length) return null
  return workouts.find(w => matchesToday(w.day_label)) || workouts[0]
}
export const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||'').trim())

export const dateLabel = iso => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
export const WORKOUT_COLORS = ['#3B82F6','#60A5FA','#818CF8','#38BDF8','#2DD4BF','#34D399','#A78BFA','#F472B6','#FB923C','#F87171']
export const GYM_ICONS = ['🏋️','💪','🏃','⚡','🔥','🥊','🏠','✈️','🎯','🏆','⚽','🧘']
export const MEAL_ICONS = ['☀️','🍽️','☕','🌙','🥗','🍎','🌮','🥛','🍵','🥜','🔥','⚡','🫙','🥣','🍳']

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

export function sumMacros(items = []) {
  return items.reduce((acc, item) => ({
    cal:  +(acc.cal  + (item.calories || item.cal  || 0)).toFixed(1),
    prot: +(acc.prot + (item.protein  || item.prot || 0)).toFixed(1),
    carb: +(acc.carb + (item.carbs    || item.carb || 0)).toFixed(1),
    fat:  +(acc.fat  + (item.fat      || 0)).toFixed(1),
  }), { cal: 0, prot: 0, carb: 0, fat: 0 })
}

export function formatWeight(w) {
  if (!w && w !== 0) return '—'
  return `${w}kg`
}

export function calcVolume(sets) {
  return sets.reduce((acc, s) => {
    const w = parseFloat(s.weight) || 0
    const r = parseInt(s.reps) || 0
    return acc + w * r
  }, 0)
}

/** Find PR (best weight) across all log entries */
export function findPR(logs) {
  let pr = 0
  for (const log of logs) {
    for (const set of (log.sets || log.exercise_sets || [])) {
      const w = parseFloat(set.weight) || 0
      if (w > pr) pr = w
    }
  }
  return pr
}

/** Detect if a new set is a PR compared to history */
export function isPR(weight, logs) {
  const w = parseFloat(weight) || 0
  if (!w) return false
  return w > findPR(logs)
}

export function smartGoals(calories, weightKg, protMultiplier = 1.9) {
  const prot = Math.round(weightKg > 0 ? weightKg * protMultiplier : calories * 0.25 / 4)
  const fat = Math.round((calories * 0.25) / 9)
  const carb = Math.max(50, Math.round((calories - prot * 4 - fat * 9) / 4))
  return { calories, protein: prot, carbs: carb, fat }
}
