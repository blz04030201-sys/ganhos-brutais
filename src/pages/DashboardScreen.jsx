import { useState, useEffect } from 'react'
import { useApp } from '../hooks/useAppContext'
import { gymService, workoutService, exerciseService, logService } from '../services/workouts'
import { profileService } from '../services/profile'
import { dietGoalsService, mealService, mealPlanService } from '../services/diet'
import { todayISO, dateLabel, sumMacros, pickTodaysWorkout } from '../utils/helpers'
import { setWorkoutIntent } from '../utils/navIntent'
import { Loader } from '../components/UI'

const DAY_STR = () => {
  const d = new Date()
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${days[d.getDay()]} • ${d.getDate()} de ${months[d.getMonth()]}`
}

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Bom dia,' : HOUR < 18 ? 'Boa tarde,' : 'Boa noite,'

export default function DashboardScreen({ setTab }) {
  const { userId, profile, toast } = useApp()

  const [gyms,         setGyms]         = useState([])
  const [selectedGym,  setSelectedGym]  = useState(null)
  const [workouts,     setWorkouts]      = useState([])
  const [selectedWk,   setSelectedWk]   = useState(null)
  const [exercises,    setExercises]     = useState([])
  const [todayLogs,    setTodayLogs]     = useState([])
  const [recentPRs,    setRecentPRs]     = useState([])
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState([]) // [{name, weight, reps}]
  const [dietTotals,   setDietTotals]    = useState({ cal:0, prot:0, carb:0, fat:0 })
  const [dietGoals,    setDietGoals]     = useState({ calories:2800, protein:180, carbs:350, fat:80 })
  const [loading,      setLoading]       = useState(true)

  // Log modal state
  const [logEx,      setLogEx]      = useState(null)
  const [logSets,    setLogSets]    = useState([])
  const [logObs,     setLogObs]     = useState('')
  const [logDate,    setLogDate]    = useState(todayISO())
  const [logHistory, setLogHistory] = useState([])
  const [logSaving,  setLogSaving]  = useState(false)

  useEffect(() => { if (userId) init() }, [userId])

  const init = async () => {
    setLoading(true)
    try {
      const [gs, dg, plan] = await Promise.all([
        gymService.list(userId),
        dietGoalsService.get(userId),
        mealPlanService.getActive(userId),
      ])
      setGyms(gs)
      setDietGoals(dg)

      if (plan) {
        const meals = await mealService.listByPlan(plan.id)
        setDietTotals(sumMacros(meals.flatMap(m => m.items || [])))
      }

      // Restore last gym
      const lastGymId = profile?.last_gym_id
      const gym = lastGymId ? gs.find(g => g.id === lastGymId) : null
      if (gym) {
        setSelectedGym(gym)
        const ws = await workoutService.listByGym(gym.id)
        setWorkouts(ws)
        // pick today's scheduled workout (by day_label), fallback to the first one
        const wk = pickTodaysWorkout(ws)
        if (wk) {
          setSelectedWk(wk)
          await loadExercises(wk)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadExercises = async (wk) => {
    const [exs, logs] = await Promise.all([
      exerciseService.listByWorkout(wk.id),
      logService.listByDate(userId, todayISO()),
    ])
    setExercises(exs)
    setTodayLogs(logs)

    // Last workout summary: for each exercise, pick the most recent session (not today)
    const today = todayISO()
    const summary = []
    for (const ex of exs.slice(0, 8)) {
      const hist = await logService.listByExercise(ex.id)
      const prev = hist.find(l => l.log_date !== today)
      if (!prev) continue
      const top = (prev.sets||[]).reduce((b, s) => (parseFloat(s.weight)||0) > (parseFloat(b?.weight)||0) ? s : b, null)
      if (top) summary.push({ name: ex.name, weight: top.weight, reps: top.reps, date: prev.log_date })
    }
    setLastWorkoutSummary(summary)

    // Build recent PRs across all exercises
    const prs = []
    for (const ex of exs.slice(0, 6)) {
      const hist = await logService.listByExercise(ex.id)
      if (hist.length < 2) continue
      const newest = hist[0]
      const prevMax = hist.slice(1).reduce((m, l) =>
        Math.max(m, ...(l.sets||[]).map(s => parseFloat(s.weight)||0)), 0)
      const newMax = Math.max(...(newest.sets||[]).map(s => parseFloat(s.weight)||0))
      if (newMax > prevMax && prevMax > 0) {
        prs.push({ name: ex.name, prev: prevMax, cur: newMax, diff: +(newMax-prevMax).toFixed(1) })
      }
    }
    setRecentPRs(prs.slice(0, 3))
  }

  const selectGym = async (gym) => {
    setSelectedGym(gym)
    setSelectedWk(null)
    setExercises([])
    setTodayLogs([])
    const ws = await workoutService.listByGym(gym.id)
    setWorkouts(ws)
    const wk = pickTodaysWorkout(ws)
    if (wk) { setSelectedWk(wk); await loadExercises(wk) }
    try { await profileService.upsert(userId, { last_gym_id: gym.id }) } catch(_) {}
  }

  const selectWorkout = async (wk) => {
    setSelectedWk(wk)
    await loadExercises(wk)
  }

  // Open log modal
  const openLog = async (ex) => {
    const hist = await logService.listByExercise(ex.id)
    setLogHistory(hist)
    const last = hist[0]
    if (last) {
      setLogSets(last.sets.map(s => ({ weight: String(s.weight||''), reps: String(s.reps||'') })))
      setLogObs(last.log_date === todayISO() ? (last.observation||'') : '')
    } else {
      setLogSets(Array.from({ length: ex.valid_sets||2 }, () => ({ weight:'', reps:'' })))
      setLogObs('')
    }
    setLogDate(todayISO())
    setLogEx(ex)
  }

  const saveLog = async () => {
    const filled = logSets.filter(s => s.weight || s.reps)
    if (!filled.length) { toast('Registre pelo menos uma série.'); return }
    setLogSaving(true)
    try {
      const prW = logHistory.reduce((m, l) =>
        Math.max(m, ...(l.sets||[]).map(s => parseFloat(s.weight)||0)), 0)
      const log = await logService.upsertLog(userId, logEx.id, logDate, logObs)
      await logService.replaceSets(log.id, userId, filled.map(s => ({
        ...s, is_pr: (parseFloat(s.weight)||0) > prW && prW > 0
      })))
      toast('✅ Registrado!')
      setLogEx(null)
      const logs = await logService.listByDate(userId, todayISO())
      setTodayLogs(logs)
    } catch(e) { toast('Erro: ' + e.message) }
    finally { setLogSaving(false) }
  }

  const getTodayLog = (exId) => todayLogs.find(l => l.exercise_id === exId)

  const weight     = parseFloat(profile?.weight) || null
  const doneCount  = exercises.filter(ex => getTodayLog(ex.id)).length
  const totalEx    = exercises.length
  const wkProgress = totalEx > 0 ? Math.round((doneCount / totalEx) * 100) : 0

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen" style={{ background:'var(--bg)' }}>

      {/* ── TOP GREETING ───────────────────────────────── */}
      <div style={{ padding:'20px 16px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ color:'var(--t2)', fontSize:14, fontWeight:500 }}>{GREETING}</p>
          <h1 style={{ fontSize:30, fontWeight:800, lineHeight:1.1, marginTop:2 }}>
            {(profile?.name || 'Atleta').split(' ')[0]} 👋
          </h1>
          <p style={{ color:'var(--t3)', fontSize:12, marginTop:4 }}>{DAY_STR()}</p>
        </div>
        <button
          onClick={() => setTab('settings')}
          style={{
            width:42, height:42, borderRadius:'50%',
            background:`linear-gradient(135deg, var(--accent), var(--purple))`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, fontWeight:800, color:'#fff',
            border:'none', flexShrink:0,
            boxShadow:'0 4px 16px var(--accent20)',
          }}
        >
          {(profile?.name||'A')[0].toUpperCase()}
        </button>
      </div>

      {/* ── TREINO CARD ────────────────────────────────── */}
      <div style={{ margin:'16px 16px 0' }}>
        <WorkoutCard
          gym={selectedGym}
          wk={selectedWk}
          exercises={exercises}
          doneCount={doneCount}
          progress={wkProgress}
          gyms={gyms}
          onSelectGym={selectGym}
          workouts={workouts}
          onSelectWorkout={selectWorkout}
          onStart={() => { if (selectedGym && selectedWk) { setWorkoutIntent(selectedGym, selectedWk); setTab('workouts') } }}
          setTab={setTab}
        />
      </div>

      {/* ── DIETA CARD ─────────────────────────────────── */}
      <div style={{ margin:'12px 16px 0' }}>
        <DietCard totals={dietTotals} goals={dietGoals} weight={weight} setTab={setTab} />
      </div>

      {/* ── ÚLTIMO TREINO ─────────────────────────────── */}
      {lastWorkoutSummary.length > 0 && (
        <div style={{ margin:'12px 16px 0' }}>
          <LastWorkoutCard summary={lastWorkoutSummary} onGo={() => { if (selectedGym && selectedWk) { setWorkoutIntent(selectedGym, selectedWk); setTab('workouts') } }} />
        </div>
      )}

      {/* ── EXERCISE LIST (se treino selecionado) ─────── */}
      {selectedWk && exercises.length > 0 && (
        <div style={{ margin:'12px 16px 0' }}>
          <ExerciseList
            exercises={exercises}
            wk={selectedWk}
            getTodayLog={getTodayLog}
            onLog={openLog}
            setTab={setTab}
          />
        </div>
      )}

      {/* ── RECORDES RECENTES ──────────────────────────── */}
      {recentPRs.length > 0 && (
        <div style={{ margin:'12px 16px 0' }}>
          <PRSection prs={recentPRs} />
        </div>
      )}

      {/* ── MINHAS ACADEMIAS ───────────────────────────── */}
      <div style={{ margin:'12px 16px 0' }}>
        <GymSection gyms={gyms} selected={selectedGym} onSelect={selectGym} setTab={setTab} />
      </div>

      <div style={{ height:24 }} />

      {/* ── LOG MODAL ──────────────────────────────────── */}
      {logEx && (
        <LogModal
          ex={logEx}
          sets={logSets}
          obs={logObs}
          date={logDate}
          history={logHistory}
          saving={logSaving}
          onClose={() => setLogEx(null)}
          onSave={saveLog}
          onSetChange={(i, vals) => setLogSets(p => p.map((x,idx) => idx===i ? {...x,...vals} : x))}
          onAddSet={() => setLogSets(p => [...p, { weight:'', reps:'' }])}
          onRemoveSet={(i) => setLogSets(p => p.filter((_,idx) => idx!==i))}
          onObsChange={setLogObs}
          onDateChange={setLogDate}
        />
      )}
    </div>
  )
}

// ── WORKOUT CARD ──────────────────────────────────────────────
function WorkoutCard({ gym, wk, exercises, doneCount, progress, gyms, onSelectGym, workouts, onSelectWorkout, onStart, setTab }) {
  const muscleGroups = wk?.display_name?.split(/[+·,]/).map(s => s.trim()).filter(Boolean) || []
  const [switching, setSwitching] = useState(false)

  return (
    <div style={{
      borderRadius:'var(--rlg)',
      overflow:'hidden',
      position:'relative',
      minHeight:170,
      background:'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #091428 100%)',
      border:'1px solid rgba(59,130,246,0.2)',
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Glow effects */}
      <div style={{ position:'absolute', top:-40, right:-20, width:200, height:200, borderRadius:'50%', background:'rgba(59,130,246,0.12)', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, left:-20, width:160, height:160, borderRadius:'50%', background:'rgba(129,140,248,0.08)', filter:'blur(50px)', pointerEvents:'none' }} />
      {/* Grid lines */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.07, pointerEvents:'none' }} viewBox="0 0 300 170" preserveAspectRatio="xMidYMid slice">
        {[0,1,2,3,4,5].map(i=><line key={i} x1={i*60} y1="0" x2={i*60} y2="170" stroke="#3B82F6" strokeWidth="1"/>)}
        {[0,1,2,3].map(i=><line key={i} x1="0" y1={i*57} x2="300" y2={i*57} stroke="#3B82F6" strokeWidth="1"/>)}
      </svg>

      <div style={{ position:'relative', padding:'16px' }}>
        {/* Label */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏋️</div>
            <span style={{ fontSize:10, fontWeight:800, color:'#60A5FA', textTransform:'uppercase', letterSpacing:'0.12em' }}>Treino de Hoje</span>
          </div>
          {wk && (
            <button onClick={() => setSwitching(s => !s)}
              style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:99, padding:'4px 10px', cursor:'pointer' }}>
              {switching ? 'Fechar ✕' : 'Trocar ▾'}
            </button>
          )}
        </div>

        {switching && (
          <div style={{ marginBottom:14, padding:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--r)' }}>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Academia</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              {gyms.map(g => (
                <button key={g.id} onClick={() => onSelectGym(g)}
                  style={{ padding:'7px 12px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
                    background: gym?.id===g.id ? `${g.color||'#3B82F6'}33` : 'rgba(255,255,255,0.06)',
                    border:`1px solid ${gym?.id===g.id ? (g.color||'#3B82F6') : 'rgba(255,255,255,0.12)'}`,
                    color: gym?.id===g.id ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                  {g.icon} {g.name}
                </button>
              ))}
            </div>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Treino</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {workouts.map(w => (
                <button key={w.id} onClick={() => { onSelectWorkout(w); setSwitching(false) }}
                  style={{ padding:'7px 12px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
                    background: wk?.id===w.id ? `${w.color||'#3B82F6'}33` : 'rgba(255,255,255,0.06)',
                    border:`1px solid ${wk?.id===w.id ? (w.color||'#3B82F6') : 'rgba(255,255,255,0.12)'}`,
                    color: wk?.id===w.id ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                  {w.name}
                </button>
              ))}
              {workouts.length===0 && <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Sem treinos nesta academia ainda.</span>}
            </div>
          </div>
        )}

        {wk ? (
          <>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:6 }}>
              {wk.display_name || wk.name}
            </h2>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:12, color:'rgba(255,255,255,0.55)' }}>
              <span>🏋️ {exercises.length} exercícios</span>
              {gym && <span>📍 {gym.name}</span>}
            </div>

            {/* Muscle group chips */}
            {muscleGroups.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {muscleGroups.map((m,i) => (
                  <span key={i} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.25)', color:'#93C5FD' }}>
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Progress */}
            {exercises.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:5 }}>
                  <span>{doneCount}/{exercises.length} exercícios</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#3B82F6,#60A5FA)', borderRadius:99, transition:'width 0.4s' }} />
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={onStart}
              style={{
                width:'100%', padding:'11px', borderRadius:'var(--r)',
                background:'linear-gradient(90deg, #2563EB, #3B82F6)',
                border:'none', color:'#fff', fontSize:13, fontWeight:800,
                letterSpacing:'0.06em', textTransform:'uppercase',
                boxShadow:'0 4px 16px rgba(37,99,235,0.4)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              {doneCount > 0 ? '▶ Continuar Treino' : '▶ Iniciar Treino'} →
            </button>
          </>
        ) : (
          /* No workout selected */
          <div>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:8 }}>
              {gym ? 'Escolha o treino de hoje:' : 'Selecione uma academia:'}
            </p>
            {!gym && gyms.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {gyms.map(g => (
                  <button key={g.id} onClick={() => onSelectGym(g)}
                    style={{ padding:'8px 14px', borderRadius:'var(--r)', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#93C5FD', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {g.icon} {g.name}
                  </button>
                ))}
              </div>
            )}
            {gym && workouts.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {workouts.map(w => (
                  <button key={w.id} onClick={() => onSelectWorkout(w)}
                    style={{ padding:'8px 14px', borderRadius:'var(--r)', background:`${w.color||'#3B82F6'}22`, border:`1px solid ${w.color||'#3B82F6'}44`, color:w.color||'#60A5FA', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {w.name}
                  </button>
                ))}
              </div>
            )}
            {gyms.length === 0 && (
              <button onClick={() => setTab('workouts')}
                style={{ padding:'9px 16px', borderRadius:'var(--r)', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#93C5FD', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                + Criar academia
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── DIET CARD ─────────────────────────────────────────────────
function LastWorkoutCard({ summary, onGo }) {
  const dateStr = summary[0]?.date
    ? new Date(summary[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' })
    : ''
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--rlg)', padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⏮️</div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Último Treino</div>
            {dateStr && <div style={{ fontSize:10, color:'var(--t3)', marginTop:1 }}>{dateStr}</div>}
          </div>
        </div>
        <button onClick={onGo} style={{ fontSize:11, fontWeight:700, color:'var(--accent)', background:'var(--accent10)', border:'1px solid var(--accent20)', borderRadius:99, padding:'5px 12px', cursor:'pointer' }}>
          Repetir →
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {summary.slice(0, 6).map((s, i) => (
          <div key={i} style={{ background:'var(--bg3)', borderRadius:'var(--rsm)', padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'var(--t2)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{s.name}</span>
            <span style={{ fontSize:12, fontWeight:800, color:'var(--accent)', flexShrink:0, letterSpacing:'-0.3px' }}>{s.weight}kg<span style={{ fontSize:9, fontWeight:600, color:'var(--t3)' }}>×{s.reps}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DietCard({ totals, goals, weight, setTab }) {
  const pct = (v,g) => g>0 ? Math.min(100, Math.round(v/g*100)) : 0
  const macros = [
    { label:'Proteína',    val:totals.prot||0, goal:goals.protein, color:'#A78BFA', min:1.6, max:2.2 },
    { label:'Carboidratos',val:totals.carb||0, goal:goals.carbs,   color:'#F59E0B', min:3,   max:6   },
    { label:'Gorduras',    val:totals.fat||0,  goal:goals.fat,     color:'#60A5FA', min:0.8, max:1.2 },
  ]
  const kcalPct = pct(totals.cal||0, goals.calories)
  const r = 26, circ = 2*Math.PI*r, dash = circ*(kcalPct/100)

  return (
    <button
      onClick={() => setTab('diet')}
      style={{ width:'100%', background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--rlg)', padding:'16px', textAlign:'left', cursor:'pointer' }}
    >
      {/* Header with calorie ring */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🥗</div>
          <span style={{ fontSize:10, fontWeight:800, color:'#34D399', textTransform:'uppercase', letterSpacing:'0.1em' }}>Dieta de Hoje</span>
        </div>
        <div style={{ position:'relative', width:60, height:60, flexShrink:0 }}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <defs>
              <linearGradient id="kcalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <circle cx="30" cy="30" r={r} fill="none" stroke="var(--b1)" strokeWidth="5" />
            <circle cx="30" cy="30" r={r} fill="none" stroke="url(#kcalGrad)" strokeWidth="5"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 30 30)"
              style={{ transition:'stroke-dasharray 0.6s cubic-bezier(0.32,0.72,0,1)' }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--t1)' }}>
            {kcalPct}%
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:14 }}>
        <span style={{ fontSize:22, fontWeight:800, color:'var(--t1)' }}>{Math.round(totals.cal||0)}</span>
        <span style={{ fontSize:12, color:'var(--t3)' }}>/ {goals.calories} kcal</span>
      </div>

      {/* Macro columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {macros.map(m => {
          const gk = weight ? (m.val / weight) : null
          const ok = gk && gk >= m.min && gk <= m.max
          const low = gk && gk < m.min
          const mp = pct(m.val, m.goal)
          return (
            <div key={m.label}>
              <div style={{ fontSize:9, fontWeight:800, color:m.color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--t1)', lineHeight:1 }}>
                {Math.round(m.val)}g
              </div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>/{m.goal}g</div>
              {gk !== null && (
                <div style={{ fontSize:9, color:'var(--t3)', marginTop:2 }}>
                  <span style={{ color: ok ? '#34D399' : low ? 'var(--orange)' : 'var(--red)', fontWeight:700 }}>{gk.toFixed(2)}</span>
                  {' / '}{m.max} g/kg
                </div>
              )}
              <div style={{ height:5, background:'var(--b1)', borderRadius:99, overflow:'hidden', marginTop:6 }}>
                <div style={{
                  height:'100%', width:`${mp}%`, borderRadius:99, transition:'width 0.6s cubic-bezier(0.32,0.72,0,1)',
                  background:`linear-gradient(90deg, color-mix(in srgb, ${m.color} 65%, transparent), ${m.color})`,
                  boxShadow: mp >= 100 ? `0 0 6px ${m.color}` : 'none',
                }} />
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:m.color, marginTop:3 }}>{mp}%</div>
            </div>
          )
        })}
      </div>
    </button>
  )
}

// ── EXERCISE LIST ─────────────────────────────────────────────
function ExerciseList({ exercises, wk, getTodayLog, onLog, setTab }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:wk.color||'var(--accent)' }} />
          <span style={{ fontSize:11, fontWeight:800, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {wk.display_name || wk.name}
          </span>
        </div>
        <button onClick={() => setTab('workouts')} style={{ fontSize:11, fontWeight:700, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
          Ver todos →
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {exercises.map(ex => {
          const log     = getTodayLog(ex.id)
          const sets    = log?.sets || log?.exercise_sets || []
          const hasSets = sets.length > 0
          const vol     = hasSets ? sets.reduce((a,s) => a + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0) : 0
          const color   = wk.color || 'var(--accent)'

          return (
            <div key={ex.id} style={{
              background:'var(--card)',
              border:`1px solid ${hasSets ? color+'44' : 'var(--b1)'}`,
              borderRadius:'var(--r)',
              overflow:'hidden',
            }}>
              <div style={{ padding:'11px 13px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:9, height:9, borderRadius:'50%', flexShrink:0,
                  background: hasSets ? '#10B981' : 'var(--b3)',
                  boxShadow: hasSets ? '0 0 7px #10B981' : 'none',
                }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>
                    {ex.valid_sets} séries
                    {hasSets && <span style={{ color:'#10B981', marginLeft:6 }}>✓ {sets.length} feitas · {vol}kg vol</span>}
                  </div>
                </div>
              </div>
              {hasSets && (
                <div style={{ padding:'0 13px 9px', display:'flex', gap:6, flexWrap:'wrap' }}>
                  {sets.map((s,i) => (
                    <span key={i} style={{
                      padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700,
                      background: s.is_pr ? 'rgba(245,158,11,0.12)' : `${color}18`,
                      border:`1px solid ${s.is_pr ? 'rgba(245,158,11,0.3)' : color+'33'}`,
                      color: s.is_pr ? 'var(--orange)' : color,
                    }}>
                      {s.is_pr ? '🏆 ' : ''}{s.weight}kg×{s.reps}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', borderTop:'1px solid var(--b2)' }}>
                <button onClick={() => setTab('workouts')}
                  style={{ flex:1, padding:'8px', fontSize:10, fontWeight:700, color:'var(--t3)', background:'none', border:'none', borderRight:'1px solid var(--b2)', cursor:'pointer' }}>
                  📊 Histórico
                </button>
                <button onClick={() => onLog(ex)}
                  style={{ flex:1, padding:'8px', fontSize:10, fontWeight:700, cursor:'pointer', border:'none',
                    color: hasSets ? '#10B981' : 'var(--accent)',
                    background: hasSets ? 'rgba(16,185,129,0.07)' : 'var(--accent10)' }}>
                  {hasSets ? '✓ Editar' : '➕ Registrar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PR SECTION ────────────────────────────────────────────────
function PRSection({ prs }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>🏆</span>
          <span style={{ fontSize:11, fontWeight:800, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Recordes Recentes</span>
        </div>
        <span style={{ fontSize:11, color:'var(--accent)', fontWeight:700 }}>Ver todos →</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
        {prs.map((pr, i) => (
          <div key={i} style={{ background:'var(--card)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--r)', padding:'12px' }}>
            <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pr.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontSize:13, color:'var(--t3)' }}>{pr.prev}kg</span>
              <span style={{ color:'var(--orange)', fontSize:12 }}>→</span>
              <span style={{ fontSize:15, fontWeight:800, color:'var(--orange)' }}>{pr.cur}kg</span>
            </div>
            <div style={{ fontSize:11, fontWeight:800, color:'#34D399' }}>+{pr.diff}kg</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GYM SECTION ───────────────────────────────────────────────
function GymSection({ gyms, selected, onSelect, setTab }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>🏟️</span>
          <span style={{ fontSize:11, fontWeight:800, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Minhas Academias</span>
        </div>
        <button onClick={() => setTab('workouts')} style={{ fontSize:11, color:'var(--accent)', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Ver todas →</button>
      </div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {gyms.map(g => (
          <button key={g.id} onClick={() => onSelect(g)}
            style={{
              flexShrink:0, padding:'11px 16px',
              borderRadius:'var(--r)',
              background: selected?.id===g.id ? `${(g.color||'var(--accent)')}1f` : 'var(--card)',
              border:`1.5px solid ${selected?.id===g.id ? (g.color||'var(--accent)') : 'var(--b1)'}`,
              borderLeft:`4px solid ${g.color||'var(--accent)'}`,
              display:'flex', alignItems:'center', gap:8, cursor:'pointer',
            }}>
            <span style={{ fontSize:18 }}>{g.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, color: selected?.id===g.id ? (g.color||'var(--accent)') : 'var(--t1)', whiteSpace:'nowrap' }}>{g.name}</span>
            <span style={{ fontSize:12, color:g.color||'var(--accent)' }}>›</span>
          </button>
        ))}
        <button onClick={() => setTab('workouts')}
          style={{ flexShrink:0, width:40, height:40, borderRadius:'var(--r)', background:'var(--bg3)', border:'1px solid var(--b1)', fontSize:20, color:'var(--t3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          +
        </button>
      </div>
    </div>
  )
}

// ── LOG MODAL ─────────────────────────────────────────────────
function LogModal({ ex, sets, obs, date, history, saving, onClose, onSave, onSetChange, onAddSet, onRemoveSet, onObsChange, onDateChange }) {
  const prW = history.reduce((m, l) =>
    Math.max(m, ...(l.sets||[]).map(s => parseFloat(s.weight)||0)), 0)
  const last = history[0]

  return (
    <div className="modal-overlay" onPointerDown={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <h3 style={{ fontSize:17, fontWeight:700 }}>{ex.name}</h3>
            {prW > 0 && <span className="chip chip-gold" style={{ marginTop:6, display:'inline-block' }}>🏆 PR atual: {prW}kg</span>}
          </div>
          <input type="date" value={date} onChange={e => onDateChange(e.target.value)}
            style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'6px 8px', fontSize:12 }} />
        </div>

        {last && last.log_date !== date && (
          <div style={{ padding:'10px 12px', background:'var(--bg3)', borderRadius:'var(--r)', border:'1px solid var(--b1)', marginBottom:12 }}>
            <div className="label" style={{ marginBottom:6 }}>Último treino — {dateLabel(last.log_date)}</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {last.sets.map((s,i) => <span key={i} style={{ fontSize:12, color:'var(--t2)', fontWeight:600 }}>S{i+1}: {s.weight}kg×{s.reps}</span>)}
            </div>
            {last.observation && <p style={{ fontSize:11, color:'var(--t3)', marginTop:5, fontStyle:'italic' }}>"{last.observation}"</p>}
          </div>
        )}

        <p className="label" style={{ marginBottom:10 }}>Séries</p>
        {sets.map((s,i) => {
          const isNewPR = (parseFloat(s.weight)||0) > prW && prW > 0
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--t3)', flexShrink:0 }}>{i+1}</div>
              <div style={{ position:'relative', flex:1 }}>
                <input className="inp" type="number" placeholder="kg" inputMode="decimal" value={s.weight}
                  onChange={e => onSetChange(i, { weight:e.target.value })}
                  style={{ paddingRight:28, borderColor: isNewPR ? 'var(--orange)' : undefined }} />
                <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--t3)' }}>kg</span>
              </div>
              <input className="inp" type="text" placeholder="reps" inputMode="numeric" value={s.reps}
                onChange={e => onSetChange(i, { reps:e.target.value })} style={{ flex:1 }} />
              {isNewPR && <span style={{ fontSize:14 }}>🏆</span>}
              {sets.length > 1 && (
                <button onClick={() => onRemoveSet(i)} style={{ color:'var(--red)', fontSize:16, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✕</button>
              )}
            </div>
          )
        })}

        <button onClick={onAddSet}
          style={{ width:'100%', padding:'9px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--t3)', fontSize:12, background:'none', cursor:'pointer', marginBottom:13 }}>
          + Série
        </button>

        <textarea className="inp" rows={2} placeholder="Observação (opcional)..." value={obs}
          onChange={e => onObsChange(e.target.value)} style={{ resize:'none', marginBottom:13 }} />

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-full" onClick={onSave} disabled={saving}>
            {saving ? '⏳ Salvando...' : '✅ Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
