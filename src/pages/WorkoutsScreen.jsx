import { useState, useEffect, useRef } from 'react'
import { useApp } from '../hooks/useAppContext'
import { gymService, workoutService, exerciseService, logService } from '../services/workouts'
import { WORKOUT_COLORS, GYM_ICONS, dateLabel, calcVolume } from '../utils/helpers'
import { Modal, Confirm, Loader, Empty } from '../components/UI'

export default function WorkoutsScreen() {
  const [view, setView] = useState('gyms')
  const [selGym, setSelGym] = useState(null)
  const [selWorkout, setSelWorkout] = useState(null)
  const [selEx, setSelEx] = useState(null)

  if (view === 'history')   return <ExHistory   ex={selEx}       onBack={() => setView('exercises')} />
  if (view === 'log')       return <LogSession  ex={selEx}       gym={selGym} workout={selWorkout} onBack={() => setView('exercises')} onDone={() => setView('exercises')} />
  if (view === 'exercises') return <ExList      workout={selWorkout} gym={selGym} onBack={() => setView('workouts')} onLog={ex => { setSelEx(ex); setView('log') }} onHistory={ex => { setSelEx(ex); setView('history') }} />
  if (view === 'workouts')  return <WorkoutList gym={selGym}     onBack={() => setView('gyms')}     onSelect={w => { setSelWorkout(w); setView('exercises') }} />
  return <GymList onSelect={g => { setSelGym(g); setView('workouts') }} />
}

/* ─────────────────────────────────────────────
   DRAG HELPER HOOK
───────────────────────────────────────────── */
function useDragSort(items, onReorder) {
  const dragIdx = useRef(null)

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver  = (e, i) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) return
    const next = [...items]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    dragIdx.current = i
    onReorder(next)
  }
  const onDragEnd = () => { dragIdx.current = null }

  return { onDragStart, onDragOver, onDragEnd }
}

/* ─────────────────────────────────────────────
   GYM LIST
───────────────────────────────────────────── */
function GymList({ onSelect }) {
  const { userId, toast } = useApp()
  const [gyms,    setGyms]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [del,     setDel]     = useState(null)
  const [form,    setForm]    = useState({ name:'', icon:'🏋️' })

  useEffect(() => { load() }, [userId])
  const load = async () => {
    try { setGyms(await gymService.list(userId)) } finally { setLoading(false) }
  }

  const { onDragStart, onDragOver, onDragEnd } = useDragSort(gyms, async (next) => {
    setGyms(next)
    await gymService.reorder(next.map(g => g.id))
  })

  const openNew  = () => { setEditing(null); setForm({ name:'', icon:'🏋️' }); setModal(true) }
  const openEdit = (g, e) => { e.stopPropagation(); setEditing(g); setForm({ name:g.name, icon:g.icon }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return
    try {
      if (editing) {
        const u = await gymService.update(editing.id, { name:form.name, icon:form.icon })
        setGyms(gs => gs.map(x => x.id===editing.id ? u : x))
        toast('Academia atualizada!')
      } else {
        const g = await gymService.create(userId, { name:form.name, icon:form.icon, sort_order:gyms.length })
        setGyms(gs => [...gs, g])
        toast('Academia criada!')
      }
      setModal(false)
    } catch(e) { toast('Erro: '+e.message) }
  }

  const remove = async () => {
    try { await gymService.delete(del.id); setGyms(gs => gs.filter(x => x.id!==del.id)); toast('Removida.') }
    finally { setDel(null) }
  }

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="title-lg">Academias</h2>
        <button onClick={openNew} style={{ color:'var(--accent)', fontSize:26, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>+</button>
      </div>

      {gyms.length === 0
        ? <Empty icon="🏋️" title="Nenhuma academia" description="Crie sua primeira academia para montar seus treinos." action={openNew} actionLabel="+ Nova Academia" />
        : (
          <div style={{ padding:'8px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>☰ Arraste para reordenar</p>
            {gyms.map((g, i) => (
              <div
                key={g.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                onClick={() => onSelect(g)}
                style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', userSelect:'none' }}
              >
                <span style={{ fontSize:12, color:'var(--t3)', cursor:'grab' }}>☰</span>
                <span style={{ fontSize:30 }}>{g.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>{g.name}</div>
                  <div style={{ color:'var(--t3)', fontSize:12, marginTop:2 }}>Toque para ver treinos →</div>
                </div>
                <button onClick={e => openEdit(g, e)} style={{ color:'var(--t2)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); setDel(g) }} style={{ color:'var(--red)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={editing ? 'Editar Academia' : 'Nova Academia'} onClose={() => setModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input className="inp" placeholder="Nome da academia" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} autoFocus />
            <div>
              <p className="label" style={{ marginBottom:8 }}>Ícone</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {GYM_ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f=>({...f,icon:ic}))}
                    style={{ fontSize:22, padding:'8px', borderRadius:'var(--rsm)', background:form.icon===ic?'var(--accent20)':'var(--bg3)', border:`1.5px solid ${form.icon===ic?'var(--accent)':'var(--b1)'}`, cursor:'pointer' }}>{ic}</button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-full" onClick={save}>Salvar</button>
            </div>
          </div>
        </Modal>
      )}
      {del && <Confirm message={`Excluir "${del.name}"? Todos os treinos e histórico serão perdidos.`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   WORKOUT LIST
───────────────────────────────────────────── */
function WorkoutList({ gym, onBack, onSelect }) {
  const { userId, toast } = useApp()
  const [workouts, setWorkouts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [del,      setDel]      = useState(null)
  const [form,     setForm]     = useState({ name:'', display_name:'', day_label:'', color:'#3B82F6' })

  useEffect(() => { load() }, [gym?.id])
  const load = async () => {
    try { setWorkouts(await workoutService.listByGym(gym.id)) } finally { setLoading(false) }
  }

  const { onDragStart, onDragOver, onDragEnd } = useDragSort(workouts, async (next) => {
    setWorkouts(next)
    await Promise.all(next.map((w,i) => workoutService.update(w.id, { sort_order:i })))
  })

  const openNew  = () => { setEditing(null); setForm({ name:'', display_name:'', day_label:'', color:'#3B82F6' }); setModal(true) }
  const openEdit = (w, e) => { e.stopPropagation(); setEditing(w); setForm({ name:w.name, display_name:w.display_name||'', day_label:w.day_label||'', color:w.color||'#3B82F6' }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return
    try {
      const fields = { name:form.name, display_name:form.display_name||form.name, day_label:form.day_label, color:form.color }
      if (editing) {
        const u = await workoutService.update(editing.id, fields)
        setWorkouts(ws => ws.map(x => x.id===editing.id ? u : x))
        toast('Treino atualizado!')
      } else {
        const w = await workoutService.create(userId, gym.id, { ...fields, sort_order:workouts.length })
        setWorkouts(ws => [...ws, w])
        toast('Treino criado!')
      }
      setModal(false)
    } catch(e) { toast('Erro: '+e.message) }
  }

  const remove = async () => {
    try { await workoutService.delete(del.id); setWorkouts(ws => ws.filter(x => x.id!==del.id)); toast('Treino removido.') }
    finally { setDel(null) }
  }

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <button onClick={onBack} style={{ color:'var(--accent)', fontWeight:700, fontSize:15, background:'none', border:'none', cursor:'pointer' }}>← {gym.icon} {gym.name}</button>
        <button onClick={openNew} style={{ color:'var(--accent)', fontSize:26, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>+</button>
      </div>

      {workouts.length === 0
        ? <Empty icon="📋" title="Nenhum treino" description={`Crie treinos para ${gym.name}.`} action={openNew} actionLabel="+ Novo Treino" />
        : (
          <div style={{ padding:'8px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>☰ Arraste para reordenar</p>
            {workouts.map((w, i) => (
              <div
                key={w.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                onClick={() => onSelect(w)}
                style={{ background:'var(--card)', borderLeft:`4px solid ${w.color||'var(--accent)'}`, border:`1px solid ${w.color||'var(--accent)'}22`, borderLeftWidth:4, borderLeftColor:w.color||'var(--accent)', borderRadius:'var(--r)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', userSelect:'none' }}
              >
                <span style={{ fontSize:12, color:'var(--t3)', cursor:'grab' }}>☰</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>{w.display_name||w.name}</div>
                  {w.day_label && <div style={{ color:'var(--t3)', fontSize:12, marginTop:2 }}>{w.day_label}</div>}
                </div>
                <button onClick={e => openEdit(w, e)} style={{ color:'var(--t2)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); setDel(w) }} style={{ color:'var(--red)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={editing ? 'Editar Treino' : 'Novo Treino'} onClose={() => setModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input className="inp" placeholder="Nome curto (ex: Push A)" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} autoFocus />
            <input className="inp" placeholder="Nome completo (ex: Peito + Tríceps)" value={form.display_name} onChange={e => setForm(f=>({...f,display_name:e.target.value}))} />
            <input className="inp" placeholder="Dia (ex: Segunda)" value={form.day_label} onChange={e => setForm(f=>({...f,day_label:e.target.value}))} />
            <div>
              <p className="label" style={{ marginBottom:8 }}>Cor</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {WORKOUT_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f=>({...f,color:c}))}
                    style={{ width:30, height:30, borderRadius:'50%', background:c, border:`3px solid ${form.color===c?'#fff':'transparent'}`, boxShadow:form.color===c?`0 0 0 2px ${c}`:'none', cursor:'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-full" onClick={save}>Salvar</button>
            </div>
          </div>
        </Modal>
      )}
      {del && <Confirm message={`Excluir "${del.name}"?`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   EXERCISE LIST
───────────────────────────────────────────── */
function ExList({ workout, gym, onBack, onLog, onHistory }) {
  const { userId, toast } = useApp()
  const [exercises, setExercises] = useState([])
  const [lastSets,  setLastSets]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [del,       setDel]       = useState(null)
  const [form,      setForm]      = useState({ name:'', valid_sets:2 })

  useEffect(() => { load() }, [workout?.id])
  const load = async () => {
    try {
      const data = await exerciseService.listByWorkout(workout.id)
      setExercises(data)
      setLastSets(await logService.listLatestByExerciseIds(data.map(e => e.id)))
    } finally { setLoading(false) }
  }

  const { onDragStart, onDragOver, onDragEnd } = useDragSort(exercises, async (next) => {
    setExercises(next)
    await exerciseService.reorder(next.map(e => e.id))
  })

  const openNew  = () => { setEditing(null); setForm({ name:'', valid_sets:2 }); setModal(true) }
  const openEdit = (ex, e) => { e.stopPropagation(); setEditing(ex); setForm({ name:ex.name, valid_sets:ex.valid_sets }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return
    try {
      const fields = { name:form.name, valid_sets:parseInt(form.valid_sets)||2 }
      if (editing) {
        const u = await exerciseService.update(editing.id, fields)
        setExercises(es => es.map(x => x.id===editing.id ? u : x))
        toast('Exercício atualizado!')
      } else {
        const ex = await exerciseService.create(userId, workout.id, { ...fields, sort_order:exercises.length })
        setExercises(es => [...es, ex])
        toast('Exercício adicionado!')
      }
      setModal(false)
    } catch(e) { toast('Erro: '+e.message) }
  }

  const remove = async () => {
    try { await exerciseService.delete(del.id); setExercises(es => es.filter(x => x.id!==del.id)) }
    finally { setDel(null) }
  }

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <button onClick={onBack} style={{ color:'var(--accent)', fontWeight:700, fontSize:14, background:'none', border:'none', cursor:'pointer' }}>← {workout.display_name||workout.name}</button>
        <button onClick={openNew} style={{ color:'var(--accent)', fontSize:26, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>+</button>
      </div>
      <div style={{ padding:'2px 16px 10px' }}>
        <span style={{ color:'var(--t3)', fontSize:12 }}>{gym.icon} {gym.name}</span>
      </div>

      {exercises.length === 0
        ? <Empty icon="🏋️" title="Nenhum exercício" description="Adicione exercícios a este treino." action={openNew} actionLabel="+ Exercício" />
        : (
          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>☰ Arraste para reordenar</p>
            {exercises.map((ex, i) => (
              <div
                key={ex.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', overflow:'hidden', userSelect:'none' }}
              >
                <div style={{ padding:'13px 14px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, color:'var(--t3)', cursor:'grab' }}>☰</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>{ex.name}</div>
                    <div style={{ color:'var(--t3)', fontSize:12, marginTop:2 }}>{ex.valid_sets} séries válidas</div>
                  </div>
                  {lastSets[ex.id] ? (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:800, fontSize:20, color:'var(--accent)', lineHeight:1.15 }}>{lastSets[ex.id].weight}kg</div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:1 }}>{lastSets[ex.id].reps} reps</div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'right', flexShrink:0, color:'var(--t3)', fontSize:13, fontWeight:600 }}>Anotar</div>
                  )}
                  <button onClick={e => openEdit(ex, e)} style={{ color:'var(--t2)', padding:6, fontSize:17, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
                  <button onClick={e => { e.stopPropagation(); setDel(ex) }} style={{ color:'var(--red)', padding:6, fontSize:17, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
                </div>
                <div style={{ display:'flex', borderTop:'1px solid var(--b2)' }}>
                  <button onClick={() => onHistory(ex)} style={{ flex:1, padding:'10px', fontSize:12, fontWeight:600, color:'var(--t2)', background:'none', border:'none', borderRight:'1px solid var(--b2)', cursor:'pointer' }}>📊 Histórico</button>
                  <button onClick={() => onLog(ex)} style={{ flex:1, padding:'10px', fontSize:12, fontWeight:700, color:'var(--accent)', background:'var(--accent10)', border:'none', cursor:'pointer' }}>➕ Registrar</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={editing ? 'Editar Exercício' : 'Novo Exercício'} onClose={() => setModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input className="inp" placeholder="Nome do exercício" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} autoFocus />
            <div>
              <p className="label" style={{ marginBottom:8 }}>Séries válidas</p>
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setForm(f=>({...f,valid_sets:n}))}
                    style={{ width:46, height:46, borderRadius:'var(--rsm)', fontWeight:700, fontSize:15, cursor:'pointer', background:form.valid_sets===n?'var(--accent)':'var(--bg3)', border:`1.5px solid ${form.valid_sets===n?'var(--accent)':'var(--b1)'}`, color:form.valid_sets===n?'#fff':'var(--t2)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-full" onClick={save}>Salvar</button>
            </div>
          </div>
        </Modal>
      )}
      {del && <Confirm message={`Excluir "${del?.name}"?`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   LOG SESSION
───────────────────────────────────────────── */
function LogSession({ ex, gym, workout, onBack, onDone }) {
  const { userId, toast } = useApp()
  const [logs,    setLogs]    = useState([])
  const [sets,    setSets]    = useState([{ weight:'', reps:'' }])
  const [obs,     setObs]     = useState('')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [ex?.id])

  const loadHistory = async () => {
    try {
      const data = await logService.listByExercise(ex.id)
      setLogs(data)
      if (data.length > 0) {
        const last = data[0]
        setSets(last.sets.map(s => ({ weight:String(s.weight||''), reps:String(s.reps||'') })))
        if (last.log_date === date) setObs(last.observation||'')
      } else {
        setSets(Array.from({ length: ex.valid_sets||3 }, () => ({ weight:'', reps:'' })))
      }
    } finally { setLoading(false) }
  }

  const prWeight = logs.reduce((m, l) => Math.max(m, ...(l.sets||[]).map(s => parseFloat(s.weight)||0)), 0)
  const lastSession = logs[0]
  const vol = sets.filter(s=>s.weight&&s.reps).reduce((a,s)=>(a+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)),0)

  const save = async () => {
    const filled = sets.filter(s => s.weight||s.reps)
    if (!filled.length) { toast('Registre pelo menos uma série.'); return }
    setSaving(true)
    try {
      const log = await logService.upsertLog(userId, ex.id, date, obs)
      await logService.replaceSets(log.id, userId, filled.map(s => ({
        ...s, is_pr: (parseFloat(s.weight)||0) > prWeight && prWeight > 0
      })))
      toast('✅ Treino registrado!')
      onDone()
    } catch(e) { toast('Erro: '+e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'6px 10px', fontSize:13 }} />
      </div>

      <div style={{ padding:'0 16px 12px' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:'var(--t1)' }}>{ex.name}</h2>
        <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
          {prWeight > 0 && <span className="chip chip-gold">🏆 PR: {prWeight}kg</span>}
          {vol > 0 && <span className="chip">📊 Vol: {vol}kg</span>}
        </div>
      </div>

      {lastSession && lastSession.log_date !== date && (
        <div style={{ margin:'0 16px 14px', padding:'12px 14px', background:'var(--bg3)', borderRadius:'var(--r)', border:'1px solid var(--b1)' }}>
          <p className="label" style={{ marginBottom:8 }}>Último treino — {dateLabel(lastSession.log_date)}</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {lastSession.sets.map((s,i) => (
              <span key={i} style={{ fontSize:13, color:'var(--t2)', fontWeight:600 }}>S{i+1}: {s.weight}kg×{s.reps}</span>
            ))}
          </div>
          {lastSession.observation && <p style={{ fontSize:12, color:'var(--t3)', marginTop:6, fontStyle:'italic' }}>"{lastSession.observation}"</p>}
        </div>
      )}

      <div style={{ padding:'0 16px' }}>
        <p className="label" style={{ marginBottom:12 }}>Séries</p>
        {sets.map((s, i) => {
          const isNewPR = (parseFloat(s.weight)||0) > prWeight && prWeight > 0
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--t2)', flexShrink:0 }}>{i+1}</div>
              <div style={{ position:'relative', flex:1 }}>
                <input className="inp" type="number" placeholder="kg" inputMode="decimal" value={s.weight}
                  onChange={e => setSets(p => p.map((x,idx) => idx===i?{...x,weight:e.target.value}:x))}
                  style={{ paddingRight:28, borderColor:isNewPR?'var(--orange)':undefined }} />
                <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--t3)' }}>kg</span>
              </div>
              <input className="inp" type="text" placeholder="reps" inputMode="numeric" value={s.reps}
                onChange={e => setSets(p => p.map((x,idx) => idx===i?{...x,reps:e.target.value}:x))}
                style={{ flex:1 }} />
              {isNewPR && <span style={{ fontSize:14 }}>🏆</span>}
              {sets.length > 1 && (
                <button onClick={() => setSets(p => p.filter((_,idx)=>idx!==i))}
                  style={{ color:'var(--red)', fontSize:16, flexShrink:0, background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>✕</button>
              )}
            </div>
          )
        })}
        <button onClick={() => setSets(p=>[...p,{weight:'',reps:''}])}
          style={{ width:'100%', padding:'10px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--t3)', fontSize:13, background:'none', cursor:'pointer', marginBottom:16 }}>
          + Adicionar série
        </button>
      </div>

      <div style={{ padding:'0 16px 16px' }}>
        <p className="label" style={{ marginBottom:8 }}>Observação</p>
        <textarea className="inp" rows={2} placeholder="Ex: dormi bem, bom peso hoje..."
          value={obs} onChange={e => setObs(e.target.value)} style={{ resize:'none' }} />
      </div>

      <div style={{ padding:'0 16px 16px' }}>
        <button className="btn btn-primary btn-full" onClick={save} disabled={saving} style={{ fontSize:16, padding:15 }}>
          {saving ? '⏳ Salvando...' : '✅ Salvar Treino'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   EXERCISE HISTORY
───────────────────────────────────────────── */
function ExHistory({ ex, onBack }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logService.listByExercise(ex.id).then(d => { setLogs(d); setLoading(false) })
  }, [ex?.id])

  const prWeight = logs.reduce((m,l) => Math.max(m,...(l.sets||[]).map(s=>parseFloat(s.weight)||0)),0)

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
      </div>
      <div style={{ padding:'0 16px 16px' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:'var(--t1)', marginBottom:6 }}>{ex.name}</h2>
        {prWeight > 0 && <span className="chip chip-gold">🏆 PR histórico: {prWeight}kg</span>}
      </div>

      {logs.length === 0
        ? <Empty icon="📊" title="Sem histórico" description="Registre treinos para ver a evolução aqui." />
        : (
          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {logs.map(log => (
              <div key={log.id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>{dateLabel(log.log_date)}</span>
                  <span style={{ color:'var(--t3)', fontSize:12 }}>Vol: {calcVolume(log.sets)}kg</span>
                </div>
                {log.sets.map((s,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--t3)', fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>{s.weight}kg × {s.reps}</span>
                    {s.is_pr && <span className="chip chip-gold" style={{ fontSize:9 }}>🏆 PR</span>}
                  </div>
                ))}
                {log.observation && (
                  <p style={{ fontSize:12, color:'var(--t3)', marginTop:8, fontStyle:'italic', borderTop:'1px solid var(--b1)', paddingTop:8 }}>"{log.observation}"</p>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
