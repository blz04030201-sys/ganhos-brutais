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
export const GYM_COLORS = [
  '#3B82F6','#2563EB','#60A5FA','#38BDF8','#0EA5E9','#06B6D4','#2DD4BF','#14B8A6',
  '#34D399','#10B981','#84CC16','#A3E635','#FACC15','#F59E0B','#FB923C','#F97316',
  '#F87171','#EF4444','#FB7185','#F472B6','#EC4899','#D946EF','#C084FC','#A78BFA',
  '#818CF8','#6366F1','#94A3B8','#FFFFFF',
]
export const GYM_ICONS = ['🏋️','💪','🏃','⚡','🔥','🥊','🏠','✈️','🎯','🏆','⚽','🧘']
export const MEAL_ICONS = [
  '☀️','🍽️','☕','🌙','🥗','🍎','🌮','🥛','🍵','🥜','🔥','⚡','🫙','🥣','🍳',
  '🍗','🍖','🥩','🍔','🌭','🥪','🌯','🍕','🍝','🍜','🍲','🍱','🍚','🍞','🥖',
  '🥑','🥦','🥕','🌽','🍠','🍄','🫘','🍌','🍇','🍓','🍉','🍊','🍍','🥝','🍒',
  '🧀','🥚','🥞','🧇','🍩','🍪','🍫','🍰','🍯','🥤','🧃','🍤','🐟','🍣','🥥',
]

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

/**
 * Estimated one-rep max (Epley formula) — used to compare "best set" across
 * different weight×reps combos, so increasing either one counts as progress.
 * Reps are capped at 30 to avoid unrealistic extrapolation on high-rep sets.
 */
export function estimate1RM(weight, reps) {
  const w = parseFloat(weight) || 0
  const r = Math.min(parseInt(reps) || 1, 30)
  if (!w) return 0
  return w * (1 + r / 30)
}

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
