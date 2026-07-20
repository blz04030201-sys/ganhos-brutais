import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../hooks/useAppContext'
import { gymService, workoutService, exerciseService, logService } from '../services/workouts'
import { cardioService, cardioConfigService, CARDIO_TYPES, cardioIcon } from '../services/cardio'
import { WORKOUT_COLORS, GYM_ICONS, GYM_COLORS, dateLabel, calcVolume } from '../utils/helpers'
import { consumeWorkoutIntent } from '../utils/navIntent'
import { useDragSort } from '../hooks/useDragSort'
import { useRefreshOnForeground } from '../hooks/useRefreshOnForeground'
import { Modal, FormSheet, Confirm, Loader, Empty, SheetPicker } from '../components/UI'

const emptyCardioConfigForm = () => ({ type:'Esteira', customType:'', duration_min:'', intensity:'', distance_km:'', calories:'', notes:'', position:'depois' })

function CardioConfigCard({ c, onEdit, onDelete }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:18, flexShrink:0 }}>{cardioIcon(c.type)}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, color:'var(--t1)' }}>{c.type}</div>
        <div style={{ fontSize:11.5, color:'var(--t3)' }}>
          {[
            c.duration_min ? `${c.duration_min} min` : null,
            c.intensity,
            c.distance_km ? `${c.distance_km} km` : null,
            c.calories ? `${c.calories} kcal` : null,
          ].filter(Boolean).join(' · ') || 'sem detalhes definidos'}
        </div>
      </div>
      <button onClick={() => onEdit(c)} className="tap-target-44" style={{ color:'var(--t2)', fontSize:14, background:'none', border:'none', cursor:'pointer', padding:'4px', flexShrink:0 }}>✏️</button>
      <button onClick={() => onDelete(c)} className="tap-target-44" style={{ color:'var(--red)', fontSize:14, background:'none', border:'none', cursor:'pointer', padding:'4px', flexShrink:0 }}>🗑️</button>
    </div>
  )
}

export default function WorkoutsScreen() {
  const [view, setView] = useState('gyms')
  const [selGym, setSelGym] = useState(null)
  const [selWorkout, setSelWorkout] = useState(null)
  const [selEx, setSelEx] = useState(null)

  // Deep-link from Dashboard's "Iniciar Treino" button: jump straight to
  // today's gym/workout instead of making the user navigate manually.
  useEffect(() => {
    const intent = consumeWorkoutIntent()
    if (intent?.gym && intent?.workout) {
      setSelGym(intent.gym)
      setSelWorkout(intent.workout)
      setView('exercises')
    }
  }, [])

  if (view === 'history')   return <ExHistory   ex={selEx}       onBack={() => setView('exercises')} />
  if (view === 'log')       return <LogSession  ex={selEx}       gym={selGym} workout={selWorkout} onBack={() => setView('exercises')} onDone={() => setView('exercises')} />
  if (view === 'exercises') return <ExList      workout={selWorkout} gym={selGym} onBack={() => setView('workouts')} onLog={ex => { setSelEx(ex); setView('log') }} onHistory={ex => { setSelEx(ex); setView('history') }} />
  if (view === 'workouts')  return <WorkoutList gym={selGym}     onBack={() => setView('gyms')}     onSelect={w => { setSelWorkout(w); setView('exercises') }} />
  return <GymList onSelect={g => { setSelGym(g); setView('workouts') }} />
}

/* ─────────────────────────────────────────────
   GYM LIST
───────────────────────────────────────────── */
function GymList({ onSelect }) {
  const { userId, toast } = useApp()
  const [gyms,    setGyms]    = useState([])
  const [gymWorkouts, setGymWorkouts] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [del,     setDel]     = useState(null)
  const [form,    setForm]    = useState({ name:'', icon:'🏋️', color:'#3B82F6' })

  useEffect(() => { load() }, [userId])
  const load = async () => {
    try {
      const gs = await gymService.list(userId)
      setGyms(gs)
      // Load the workouts for every gym so we can show them as small tags
      // right on the gym card, in the exact order they were created.
      const map = {}
      await Promise.all(gs.map(async g => { map[g.id] = await workoutService.listByGym(g.id) }))
      setGymWorkouts(map)
    } finally { setLoading(false) }
  }

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(gyms, async (next) => {
    setGyms(next)
    await gymService.reorder(next.map(g => g.id))
  })

  const openNew  = () => { setEditing(null); setForm({ name:'', icon:'🏋️', color:'#3B82F6' }); setModal(true) }
  const openEdit = (g, e) => { e.stopPropagation(); setEditing(g); setForm({ name:g.name, icon:g.icon, color:g.color||'#3B82F6' }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return
    try {
      if (editing) {
        const u = await gymService.update(editing.id, { name:form.name, icon:form.icon, color:form.color })
        setGyms(gs => gs.map(x => x.id===editing.id ? u : x))
        toast('Academia atualizada!')
      } else {
        const g = await gymService.create(userId, { name:form.name, icon:form.icon, color:form.color, sort_order:gyms.length })
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
                {...getItemProps(i)}
                onClick={() => onSelect(g)}
                className={dragIndex === i ? 'drag-ghost' : ''}
                style={{ background:'var(--card)', border:`1px solid ${(g.color||'var(--accent)')}33`, borderLeft:`4px solid ${g.color||'var(--accent)'}`, borderRadius:'var(--r)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', userSelect:'none' }}
              >
                <span {...getHandleProps(i)} style={{ ...getHandleProps(i).style, fontSize:18, color:'var(--t3)', padding:'8px 4px' }}>☰</span>
                <span style={{ fontSize:22, width:34, height:34, borderRadius:10, background:`${(g.color||'var(--accent)')}1f`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{g.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>{g.name}</div>
                  {gymWorkouts[g.id]?.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4, alignItems:'center' }}>
                      {gymWorkouts[g.id].map(w => {
                        const c = w.color || 'var(--accent)'
                        return (
                          <span key={w.id} style={{
                            display:'inline-flex', alignItems:'center', gap:3,
                            fontSize:10, fontWeight:700, color:c,
                            background:`${c}18`, border:`1px solid ${c}30`,
                            borderRadius:99, padding:'1px 6px 1px 4px', lineHeight:1.4, whiteSpace:'nowrap',
                          }}>
                            <span style={{ width:5, height:5, borderRadius:'50%', background:c, flexShrink:0 }} />
                            {w.name}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ color:'var(--t3)', fontSize:12, marginTop:2 }}>Toque para ver treinos →</div>
                  )}
                </div>
                <button onClick={e => openEdit(g, e)} className="tap-target-44" style={{ color:'var(--t3)', fontSize:15, padding:'5px 4px', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); setDel(g) }} className="tap-target-44" style={{ color:'var(--t3)', fontSize:15, padding:'5px 4px', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>🗑️</button>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <FormSheet title={editing ? 'Editar Academia' : 'Nova Academia'} onClose={() => setModal(false)} onSave={save} saveLabel={editing ? 'Salvar alterações' : 'Criar academia'}>
          <input className="inp" placeholder="Nome da academia" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} data-autofocus />
          <div>
            <p className="label" style={{ marginBottom:8 }}>Cor de identificação</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {GYM_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,color:c}))}
                  style={{ width:30, height:30, borderRadius:'50%', background:c, border:`3px solid ${form.color===c?'#fff':'transparent'}`, boxShadow:form.color===c?`0 0 0 2px ${c}`:(c==='#FFFFFF'?'0 0 0 1px var(--b3) inset':'none'), cursor:'pointer' }} />
              ))}
            </div>
          </div>
          <div>
            <p className="label" style={{ marginBottom:8 }}>Ícone</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {GYM_ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f=>({...f,icon:ic}))}
                  style={{ fontSize:22, padding:'8px', borderRadius:'var(--rsm)', background:form.icon===ic?'var(--accent20)':'var(--bg3)', border:`1.5px solid ${form.icon===ic?'var(--accent)':'var(--b1)'}`, cursor:'pointer' }}>{ic}</button>
              ))}
            </div>
          </div>
        </FormSheet>
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
  const [exCounts,  setExCounts]  = useState({})
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [del,      setDel]      = useState(null)
  const [form,     setForm]     = useState({ name:'', display_name:'', day_label:'', color:'#3B82F6' })
  const [dayPick,  setDayPick]  = useState(false)
  const WEEKDAYS = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo']

  useEffect(() => { load() }, [gym?.id])
  const load = async () => {
    try {
      const ws = await workoutService.listByGym(gym.id)
      setWorkouts(ws)
      const counts = {}
      await Promise.all(ws.map(async w => {
        const exs = await exerciseService.listByWorkout(w.id)
        counts[w.id] = exs.length
      }))
      setExCounts(counts)
    } finally { setLoading(false) }
  }

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(workouts, async (next) => {
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
        setExCounts(c => ({ ...c, [w.id]: 0 }))
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
                {...getItemProps(i)}
                onClick={() => onSelect(w)}
                className={dragIndex === i ? 'drag-ghost' : ''}
                style={{ background:'var(--card)', borderLeft:`4px solid ${w.color||'var(--accent)'}`, border:`1px solid ${w.color||'var(--accent)'}22`, borderLeftWidth:4, borderLeftColor:w.color||'var(--accent)', borderRadius:'var(--r)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', userSelect:'none' }}
              >
                <span {...getHandleProps(i)} style={{ ...getHandleProps(i).style, fontSize:18, color:'var(--t3)', padding:'8px 4px' }}>☰</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:17, color:'var(--t1)', letterSpacing:'-0.01em' }}>{w.name}</div>
                  {w.display_name && w.display_name !== w.name && (
                    <div style={{ color:'var(--t2)', fontSize:12, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.display_name}</div>
                  )}
                  <div style={{ color:'var(--t3)', fontSize:11, marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                    {w.day_label && <span>{w.day_label}</span>}
                    <span>{w.day_label ? '·' : ''} {exCounts[w.id] ?? 0} exercícios</span>
                  </div>
                </div>
                <button onClick={e => openEdit(w, e)} className="tap-target-44" style={{ color:'var(--t2)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); setDel(w) }} className="tap-target-44" style={{ color:'var(--red)', fontSize:18, padding:6, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <FormSheet title={editing ? 'Editar Treino' : 'Novo Treino'} onClose={() => setModal(false)} onSave={save} saveLabel={editing ? 'Salvar alterações' : 'Criar treino'}>
          <input className="inp" placeholder="Nome curto (ex: Push A)" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} data-autofocus />
          <input className="inp" placeholder="Nome completo (ex: Peito + Tríceps)" value={form.display_name} onChange={e => setForm(f=>({...f,display_name:e.target.value}))} />
          <div>
            <p className="label" style={{ marginBottom:8 }}>Dia da semana</p>
            <button onClick={() => setDayPick(true)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:form.day_label?'var(--t1)':'var(--t3)', padding:'12px 14px', fontSize:15, minHeight:48 }}>
              <span>{form.day_label || 'Selecionar dia'}</span>
              <span style={{ color:'var(--t3)', fontSize:13 }}>▾</span>
            </button>
          </div>
          <div>
            <p className="label" style={{ marginBottom:8 }}>Cor</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {WORKOUT_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,color:c}))}
                  style={{ width:30, height:30, borderRadius:'50%', background:c, border:`3px solid ${form.color===c?'#fff':'transparent'}`, boxShadow:form.color===c?`0 0 0 2px ${c}`:'none', cursor:'pointer' }} />
              ))}
            </div>
          </div>
        </FormSheet>
      )}
      {del && <Confirm message={`Excluir "${del.name}"?`} onConfirm={remove} onCancel={() => setDel(null)} />}
      {dayPick && (
        <SheetPicker title="Dia da semana" options={WEEKDAYS} selected={form.day_label}
          onSelect={d => setForm(f=>({...f,day_label:d}))} onClose={() => setDayPick(false)} />
      )}
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
  const [prs,       setPrs]       = useState({})
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [del,       setDel]       = useState(null)
  const [form,      setForm]      = useState({ name:'', valid_sets:2 })

  // Cardio — referência fixa do treino (criada aqui, igual a um exercício)
  const [cardioConfigs,   setCardioConfigs]   = useState([])
  const [cardioModal,     setCardioModal]     = useState(false)
  const [editingCardio,   setEditingCardio]   = useState(null)
  const [delCardio,       setDelCardio]       = useState(null)
  const [cardioForm,      setCardioForm]      = useState(emptyCardioConfigForm())
  const [cardioSaving,    setCardioSaving]    = useState(false)

  useEffect(() => { load() }, [workout?.id])
  useRefreshOnForeground(() => { if (workout?.id) load() })
  const load = async () => {
    try {
      const data = await exerciseService.listByWorkout(workout.id)
      setExercises(data)
      const ids = data.map(e => e.id)
      const [last, prMap, cfgs] = await Promise.all([
        logService.listLatestByExerciseIds(ids),
        logService.listPRsByExerciseIds(ids),
        cardioConfigService.listByWorkout(workout.id),
      ])
      setLastSets(last)
      setPrs(prMap)
      setCardioConfigs(cfgs)
    } finally { setLoading(false) }
  }

  const openNewCardio  = () => { setEditingCardio(null); setCardioForm(emptyCardioConfigForm()); setCardioModal(true) }
  const openEditCardio = (c) => {
    setEditingCardio(c)
    setCardioForm({
      type: CARDIO_TYPES.some(t => t.key === c.type) ? c.type : 'Personalizado',
      customType: CARDIO_TYPES.some(t => t.key === c.type) ? '' : c.type,
      duration_min: c.duration_min || '', intensity: c.intensity || '',
      distance_km: c.distance_km || '', calories: c.calories || '',
      notes: c.notes || '', position: c.position || 'depois',
    })
    setCardioModal(true)
  }

  const saveCardioConfig = async () => {
    const type = cardioForm.type === 'Personalizado' && cardioForm.customType.trim() ? cardioForm.customType.trim() : cardioForm.type
    setCardioSaving(true)
    try {
      const fields = { ...cardioForm, type }
      if (editingCardio) {
        const u = await cardioConfigService.update(editingCardio.id, fields)
        setCardioConfigs(cs => cs.map(x => x.id===editingCardio.id ? u : x))
        toast('Cardio atualizado!')
      } else {
        const c = await cardioConfigService.create(userId, workout.id, { ...fields, sort_order: cardioConfigs.length })
        setCardioConfigs(cs => [...cs, c])
        toast('🏃 Cardio adicionado ao treino!')
      }
      setCardioModal(false)
    } catch(e) { toast('Erro: '+e.message) }
    finally { setCardioSaving(false) }
  }

  const removeCardioConfig = async () => {
    try { await cardioConfigService.delete(delCardio.id); setCardioConfigs(cs => cs.filter(x => x.id!==delCardio.id)); toast('Cardio removido do treino.') }
    finally { setDelCardio(null) }
  }

  const cardioBefore = cardioConfigs.filter(c => c.position === 'antes')
  const cardioAfter  = cardioConfigs.filter(c => c.position !== 'antes')

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(exercises, async (next) => {
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
      <div style={{ padding:'2px 16px 6px' }}>
        <span style={{ color:'var(--t3)', fontSize:12 }}>{gym.icon} {gym.name}</span>
      </div>

      {cardioBefore.length > 0 && (
        <div style={{ padding:'0 16px 14px' }}>
          <p className="label" style={{ marginBottom:8 }}>🏃 Cardio · antes do treino</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {cardioBefore.map(c => <CardioConfigCard key={c.id} c={c} onEdit={openEditCardio} onDelete={setDelCardio} />)}
          </div>
        </div>
      )}

      {exercises.length === 0
        ? <Empty icon="🏋️" title="Nenhum exercício" description="Adicione exercícios a este treino." action={openNew} actionLabel="+ Exercício" />
        : (
          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:6 }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>☰ Arraste para reordenar</p>
            {exercises.map((ex, i) => {
              const last = lastSets[ex.id]
              const pr   = prs[ex.id]
              return (
              <div
                key={ex.id}
                {...getItemProps(i)}
                className={dragIndex === i ? 'drag-ghost' : ''}
                style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', overflow:'hidden', userSelect:'none' }}
              >
                <div style={{ padding:'8px 10px 8px 8px', display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span {...getHandleProps(i)} style={{ ...getHandleProps(i).style, fontSize:15, color:'var(--t4)', padding:'5px 3px', flexShrink:0, marginTop:1 }}>⠿</span>
                  {/* Left: name + séries válidas sempre visíveis */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:1 }}>{ex.name}</div>
                    <div style={{ color:'var(--t3)', fontSize:11 }}>{ex.valid_sets} série{ex.valid_sets !== 1 ? 's' : ''} válida{ex.valid_sets !== 1 ? 's' : ''}</div>
                  </div>
                  {/* Right: last sets in blue + PR, compact column */}
                  {(last || pr) && (
                    <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                      {last?.sets.map((s,si) => (
                        <div key={si} style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ fontSize:9, color:'var(--t3)', fontWeight:600, minWidth:14, textAlign:'right' }}>{si+1}ª</span>
                          <span style={{ fontSize:13, fontWeight:800, color:'var(--accent)', letterSpacing:'-0.3px' }}>
                            {s.weight}<span style={{ fontSize:9, fontWeight:600, color:'var(--t3)' }}>kg</span>
                            {' '}<span style={{ fontSize:11, color:'var(--t2)' }}>×</span>{' '}
                            {s.reps}
                          </span>
                        </div>
                      ))}
                      {pr && (
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:0 }}>
                          <span style={{ fontSize:9, color:'var(--orange)', fontWeight:700 }}>🏆</span>
                          <span style={{ fontSize:12, fontWeight:800, color:'var(--orange)', letterSpacing:'-0.3px' }}>
                            {pr.weight}<span style={{ fontSize:9, fontWeight:600 }}>kg</span>
                            {' '}<span style={{ fontSize:10 }}>×</span>{' '}
                            {pr.reps}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, marginLeft:4 }}>
                    <button onClick={e => openEdit(ex, e)} className="tap-target-row" style={{ color:'var(--t2)', padding:'2px 5px', fontSize:14, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); setDel(ex) }} className="tap-target-row" style={{ color:'var(--red)', padding:'2px 5px', fontSize:14, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display:'flex', borderTop:'1px solid var(--b2)', alignItems:'stretch' }}>
                  {/* Histórico — esquerda, discreto */}
                  <button onClick={() => onHistory(ex)}
                    style={{ flex:1, padding:'7px 6px', fontSize:11, fontWeight:600, color:'var(--t3)', background:'none', border:'none', borderRight:'1px solid var(--b2)', cursor:'pointer' }}>
                    📊 Histórico
                  </button>
                  {/* YouTube — centro, ícone pequeno apenas */}
                  <button
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name)}`, '_blank', 'noopener,noreferrer')}
                    title={`Buscar "${ex.name}" no YouTube`}
                    style={{ padding:'7px 12px', display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', borderRight:'1px solid var(--b2)', cursor:'pointer', flexShrink:0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/><polygon fill="#fff" points="9.6 15.6 15.8 12 9.6 8.4 9.6 15.6"/></svg>
                  </button>
                  {/* Registrar — direita, destaque total */}
                  <button onClick={() => onLog(ex)}
                    style={{ flex:2, padding:'5px 8px', fontSize:11, fontWeight:700, color:'#fff', background:'linear-gradient(90deg, var(--accentD), var(--accent))', border:'none', cursor:'pointer', letterSpacing:'0.02em' }}>
                    ➕ Registrar
                  </button>
                </div>
              </div>
            )})}
          </div>
        )
      }

      <div style={{ padding:'20px 16px 4px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:cardioAfter.length ? 10 : 4 }}>
          <span className="section-title" style={{ padding:0 }}>
            🏃 Cardio <span style={{ color:'var(--t4)', fontWeight:600, textTransform:'none', letterSpacing:0 }}>(opcional · depois do treino)</span>
          </span>
          <button onClick={openNewCardio} style={{ color:'var(--accent)', fontSize:13, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>+ Adicionar</button>
        </div>
        {cardioAfter.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {cardioAfter.map(c => <CardioConfigCard key={c.id} c={c} onEdit={openEditCardio} onDelete={setDelCardio} />)}
          </div>
        ) : (
          <p style={{ fontSize:12.5, color:'var(--t3)' }}>Nenhum cardio configurado para este treino. Se não fizer cardio, pode deixar assim.</p>
        )}
      </div>

      {modal && (
        <FormSheet title={editing ? 'Editar Exercício' : 'Novo Exercício'} onClose={() => setModal(false)} onSave={save} saveLabel={editing ? 'Salvar alterações' : 'Criar exercício'}>
          <input className="inp" placeholder="Nome do exercício" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} data-autofocus />
          <div>
            <p className="label" style={{ marginBottom:8 }}>Séries válidas</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => setForm(f=>({...f,valid_sets:n}))}
                  style={{ width:46, height:46, borderRadius:'var(--rsm)', fontWeight:700, fontSize:15, cursor:'pointer', background:form.valid_sets===n?'var(--accent)':'var(--bg3)', border:`1.5px solid ${form.valid_sets===n?'var(--accent)':'var(--b1)'}`, color:form.valid_sets===n?'#fff':'var(--t2)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </FormSheet>
      )}
      {del && <Confirm message={`Excluir "${del?.name}"?`} onConfirm={remove} onCancel={() => setDel(null)} />}

      {cardioModal && (
        <FormSheet title={editingCardio ? 'Editar Cardio' : 'Novo Cardio'} onClose={() => setCardioModal(false)} onSave={saveCardioConfig} saving={cardioSaving} saveLabel={editingCardio ? 'Salvar alterações' : 'Adicionar ao treino'}>
          <div>
            <p className="label" style={{ marginBottom:8 }}>Modalidade</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {CARDIO_TYPES.map(t => (
                <button key={t.key} onClick={() => setCardioForm(f=>({...f,type:t.key}))}
                  style={{ padding:'8px 12px', borderRadius:99, fontSize:12.5, fontWeight:700, cursor:'pointer',
                    background: cardioForm.type===t.key ? 'var(--accent)' : 'var(--bg3)',
                    border:`1.5px solid ${cardioForm.type===t.key ? 'var(--accent)' : 'var(--b1)'}`,
                    color: cardioForm.type===t.key ? '#fff' : 'var(--t2)' }}>
                  {t.icon} {t.key}
                </button>
              ))}
            </div>
          </div>

          {cardioForm.type === 'Personalizado' && (
            <input className="inp" placeholder="Nome do cardio" value={cardioForm.customType} onChange={e => setCardioForm(f=>({...f,customType:e.target.value}))} data-autofocus />
          )}

          <div>
            <p className="label" style={{ marginBottom:8 }}>Posição no treino</p>
            <div style={{ display:'flex', gap:8 }}>
              {[{ key:'antes', label:'Antes do treino' }, { key:'depois', label:'Depois do treino' }].map(p => (
                <button key={p.key} onClick={() => setCardioForm(f=>({...f,position:p.key}))}
                  style={{ flex:1, padding:'10px', borderRadius:'var(--rsm)', fontSize:12.5, fontWeight:700, cursor:'pointer',
                    background: cardioForm.position===p.key ? 'var(--accent)' : 'var(--bg3)',
                    border:`1.5px solid ${cardioForm.position===p.key ? 'var(--accent)' : 'var(--b1)'}`,
                    color: cardioForm.position===p.key ? '#fff' : 'var(--t2)' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <p className="label" style={{ marginBottom:8 }}>Tempo (min)</p>
              <input className="inp" type="number" inputMode="numeric" placeholder="30" value={cardioForm.duration_min} onChange={e => setCardioForm(f=>({...f,duration_min:e.target.value}))} />
            </div>
            <div style={{ flex:1 }}>
              <p className="label" style={{ marginBottom:8 }}>Intensidade</p>
              <input className="inp" placeholder="Ex: Velocidade 6" value={cardioForm.intensity} onChange={e => setCardioForm(f=>({...f,intensity:e.target.value}))} />
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <p className="label" style={{ marginBottom:8 }}>Distância (km)</p>
              <input className="inp" type="number" inputMode="decimal" placeholder="opcional" value={cardioForm.distance_km} onChange={e => setCardioForm(f=>({...f,distance_km:e.target.value}))} />
            </div>
            <div style={{ flex:1 }}>
              <p className="label" style={{ marginBottom:8 }}>Calorias</p>
              <input className="inp" type="number" inputMode="numeric" placeholder="opcional" value={cardioForm.calories} onChange={e => setCardioForm(f=>({...f,calories:e.target.value}))} />
            </div>
          </div>

          <div>
            <p className="label" style={{ marginBottom:8 }}>Observações</p>
            <textarea className="inp" rows={2} placeholder="opcional" value={cardioForm.notes} onChange={e => setCardioForm(f=>({...f,notes:e.target.value}))} style={{ resize:'none' }} />
          </div>
        </FormSheet>
      )}
      {delCardio && <Confirm message={`Remover o cardio "${delCardio.type}" deste treino? O histórico de registros dele também será apagado.`} onConfirm={removeCardioConfig} onCancel={() => setDelCardio(null)} />}
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
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [cardioItems, setCardioItems] = useState([])

  useEffect(() => { loadHistory() }, [ex?.id])
  useEffect(() => { loadCardio() }, [workout?.id, date])

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

  // Cardio — referência(s) do treino, pré-preenchidas e editáveis para esta data
  const loadCardio = async () => {
    if (!workout?.id) { setCardioItems([]); return }
    try {
      const configs = await cardioService.listByWorkoutDate(workout.id, date)
      const items = await Promise.all(configs.map(async c => {
        const last = c.today ? null : await cardioService.getLast(c.id, date)
        return {
          configId: c.id,
          type: c.today?.type || c.type,
          duration_min: c.today?.duration_min != null ? String(c.today.duration_min) : (c.duration_min != null ? String(c.duration_min) : ''),
          intensity: c.today?.intensity ?? c.intensity ?? '',
          distance_km: c.today?.distance_km != null ? String(c.today.distance_km) : (c.distance_km != null ? String(c.distance_km) : ''),
          calories: c.today?.calories != null ? String(c.today.calories) : (c.calories != null ? String(c.calories) : ''),
          notes: c.today?.notes ?? c.notes ?? '',
          skip: false,
          todayLogId: c.today?.id || null,
          last,
        }
      }))
      setCardioItems(items)
    } catch(e) { /* silencioso — cardio é opcional */ }
  }

  const updateCardio = (configId, field, value) =>
    setCardioItems(p => p.map(it => it.configId===configId ? { ...it, [field]:value } : it))
  const toggleSkipCardio = (configId) =>
    setCardioItems(p => p.map(it => it.configId===configId ? { ...it, skip: !it.skip } : it))

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
      // Cardio — salva junto com o treino (referência editada para esta data)
      for (const it of cardioItems) {
        if (it.skip) {
          if (it.todayLogId) await cardioService.delete(it.todayLogId)
          continue
        }
        if (!it.duration_min && !it.intensity) continue
        await cardioService.upsert(userId, it.configId, date, it)
      }
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
          style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'6px 10px', fontSize:16 }} />
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

      {/* ── CARDIO — referência(s) do treino, editável para o dia ───── */}
      {cardioItems.length > 0 && (
        <div style={{ margin:'0 16px 16px' }}>
          <p className="label" style={{ marginBottom:10 }}>🏃 Cardio <span style={{ color:'var(--t4)', fontWeight:400, fontSize:10 }}>referência do treino</span></p>

          {cardioItems.map(it => (
            <div key={it.configId} style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'12px', marginBottom:10, opacity: it.skip ? 0.55 : 1, transition:'opacity 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: it.skip ? 0 : 8 }}>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--t1)' }}>{cardioIcon(it.type)} {it.type}</span>
                <button onClick={() => toggleSkipCardio(it.configId)}
                  style={{ fontSize:11, fontWeight:700, color: it.skip ? 'var(--t3)' : 'var(--red)', background:'none', border:'none', cursor:'pointer' }}>
                  {it.skip ? '↺ Fazer hoje' : '✕ Não fiz hoje'}
                </button>
              </div>

              {!it.skip && (
                <>
                  {it.last && (
                    <p style={{ fontSize:11, color:'var(--t3)', marginBottom:8 }}>
                      Último registrado: {it.last.duration_min ? `${it.last.duration_min} min` : ''}{it.last.intensity ? ` · ${it.last.intensity}` : ''} ({dateLabel(it.last.log_date)})
                    </p>
                  )}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                    {CARDIO_TYPES.map(t => (
                      <button key={t.key} onClick={() => updateCardio(it.configId, 'type', t.key)}
                        style={{ padding:'4px 9px', borderRadius:99, fontSize:10.5, fontWeight:700, cursor:'pointer',
                          background: it.type===t.key ? 'var(--accent)' : 'var(--bg3)',
                          border:`1px solid ${it.type===t.key ? 'var(--accent)' : 'var(--b1)'}`,
                          color: it.type===t.key ? '#fff' : 'var(--t3)' }}>
                        {t.icon} {t.key}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input className="inp" type="number" inputMode="numeric" placeholder="Tempo"
                        value={it.duration_min} onChange={e => updateCardio(it.configId,'duration_min', e.target.value)} style={{ paddingRight:30 }} />
                      <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--t3)' }}>min</span>
                    </div>
                    <input className="inp" placeholder="Intensidade (ex: Velocidade 6)"
                      value={it.intensity} onChange={e => updateCardio(it.configId,'intensity', e.target.value)} style={{ flex:1.4 }} />
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="inp" type="number" inputMode="decimal" placeholder="Distância (km, opcional)"
                      value={it.distance_km} onChange={e => updateCardio(it.configId,'distance_km', e.target.value)} style={{ flex:1 }} />
                    <input className="inp" type="number" inputMode="numeric" placeholder="Calorias (opcional)"
                      value={it.calories} onChange={e => updateCardio(it.configId,'calories', e.target.value)} style={{ flex:1 }} />
                  </div>
                </>
              )}
            </div>
          ))}
          <p style={{ fontSize:10.5, color:'var(--t4)' }}>O cardio é salvo automaticamente junto com o treino. Para adicionar ou remover uma referência de cardio, use a aba do treino.</p>
        </div>
      )}

      <div className="sticky-action-bar" style={{ padding:'10px 16px 16px' }}>
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
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [chartKey, setChartKey] = useState('weight')

  useEffect(() => {
    logService.listByExercise(ex.id).then(d => { setLogs(d); setLoading(false) })
  }, [ex?.id])

  const prWeight = logs.reduce((m,l) => Math.max(m,...(l.sets||[]).map(s=>parseFloat(s.weight)||0)),0)

  // Chronological (oldest → newest) for the chart, one point per session:
  // top weight lifted and its best rep count for that session.
  const chartData = logs.slice().reverse().map(log => {
    const sets = log.sets || []
    const topSet = sets.reduce((best, s) => (parseFloat(s.weight)||0) > (parseFloat(best?.weight)||0) ? s : best, sets[0])
    return {
      date: dateLabel(log.log_date).slice(0,5),
      weight: topSet ? parseFloat(topSet.weight)||null : null,
      reps: topSet ? parseInt(topSet.reps)||null : null,
    }
  }).filter(d => d.weight !== null || d.reps !== null)

  const CHART_OPTIONS = [
    { key:'weight', label:'Carga (kg)',    color:'var(--accent)' },
    { key:'reps',   label:'Repetições',    color:'var(--orange)' },
  ]
  const cur = CHART_OPTIONS.find(o => o.key === chartKey)

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

      {/* Evolution chart */}
      {chartData.length >= 2 && (
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {CHART_OPTIONS.map(o => (
              <button key={o.key} onClick={() => setChartKey(o.key)}
                style={{ padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700, whiteSpace:'nowrap',
                  background: chartKey === o.key ? o.color : 'var(--bg3)',
                  color: chartKey === o.key ? '#fff' : 'var(--t3)',
                  border:`1px solid ${chartKey === o.key ? o.color : 'var(--b1)'}`,
                  cursor:'pointer',
                }}>
                {o.label}
              </button>
            ))}
          </div>
          <div style={{ height:160, background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'10px 4px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top:4, right:12, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
                <XAxis dataKey="date" tick={{ fill:'var(--t3)', fontSize:10 }} />
                <YAxis tick={{ fill:'var(--t3)', fontSize:10 }} domain={['auto','auto']} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:'var(--t2)' }}
                  formatter={(v) => [chartKey === 'weight' ? `${v}kg` : v, cur.label]}
                />
                <Line type="monotone" dataKey={chartKey} stroke={cur.color} strokeWidth={2} dot={{ r:3, fill:cur.color }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
