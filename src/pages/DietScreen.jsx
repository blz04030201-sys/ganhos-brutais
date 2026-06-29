import { useState, useEffect, useRef } from 'react'
import { useApp } from '../hooks/useAppContext'
import { mealPlanService, mealService, mealItemService, dietGoalsService } from '../services/diet'
import { profileService } from '../services/profile'
import { searchFoods, calcMacros, findFood, getFoodUnits, MEAL_PRESETS } from '../utils/foodsDb'
import { sumMacros, MEAL_ICONS, smartGoals } from '../utils/helpers'
import { Modal, Confirm, Loader, Empty, SectionHeader } from '../components/UI'

/* ─────────────────────────────────────────────
   DRAG HELPER
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
   MAIN SCREEN
───────────────────────────────────────────── */
export default function DietScreen() {
  const { userId, profile, refreshProfile, toast } = useApp()
  const [plan,     setPlan]     = useState(null)
  const [meals,    setMeals]    = useState([])
  const [goals,    setGoals]    = useState({ calories:2800, protein:180, carbs:350, fat:80 })
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('plan') // plan | goals | editMeal
  const [editMeal, setEditMeal] = useState(null)

  useEffect(() => { if (userId) load() }, [userId])

  const load = async () => {
    try {
      const [g, p] = await Promise.all([dietGoalsService.get(userId), mealPlanService.getActive(userId)])
      setGoals(g)
      if (p) { setPlan(p); setMeals(await mealService.listByPlan(p.id)) }
      else   { const np = await mealPlanService.create(userId); setPlan(np); setMeals([]) }
    } finally { setLoading(false) }
  }

  const reloadMeals = async () => setMeals(await mealService.listByPlan(plan.id))

  const { onDragStart, onDragOver, onDragEnd } = useDragSort(meals, async (next) => {
    setMeals(next)
    await mealService.reorder(next.map(m => m.id))
  })

  const totals = sumMacros(meals.flatMap(m => m.items || []))
  const weight = parseFloat(profile?.weight) || null
  const pct = (v,g) => g>0 ? Math.min(100, Math.round(v/g*100)) : 0

  if (loading) return <div className="screen"><Loader /></div>

  if (view === 'goals') return (
    <GoalsEditor goals={goals} userId={userId} profile={profile} refreshProfile={refreshProfile}
      onSave={g => { setGoals(g); setView('plan'); toast('Metas salvas!') }}
      onBack={() => setView('plan')} />
  )

  if (view === 'editMeal') return (
    <MealEditor meal={editMeal} plan={plan} userId={userId}
      onSave={async () => { await reloadMeals(); setView('plan') }}
      onBack={() => setView('plan')} />
  )

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <h2 className="title-lg">Dieta</h2>
        <button onClick={() => setView('goals')} style={{ color:'var(--accent)', fontSize:13, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>⚙️ Metas</button>
      </div>

      {/* Macro summary */}
      <MacroSummary totals={totals} goals={goals} weight={weight} pct={pct} />

      {/* Meals */}
      <SectionHeader title="Refeições" action={() => { setEditMeal(null); setView('editMeal') }} actionLabel="+ Nova" />

      {meals.length === 0
        ? <Empty icon="🥗" title="Nenhuma refeição" description="Adicione refeições para montar sua dieta."
            action={() => { setEditMeal(null); setView('editMeal') }} actionLabel="+ Adicionar" />
        : (
          <div style={{ padding:'0 16px' }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:8 }}>☰ Arraste para reordenar</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {meals.map((m, i) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                >
                  <MealCard
                    meal={m}
                    onEdit={() => { setEditMeal(m); setView('editMeal') }}
                    onDelete={async () => { await mealService.delete(m.id); await reloadMeals(); toast('Refeição removida.') }}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      }
      <div style={{ height:16 }} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   MACRO SUMMARY
───────────────────────────────────────────── */
function MacroSummary({ totals, goals, weight, pct }) {
  const protCal = totals.prot*4, carbCal = totals.carb*4, fatCal = totals.fat*9
  const macTotal = protCal+carbCal+fatCal || 1

  // SVG pie
  const buildPie = (vals) => {
    const total = vals.reduce((a,b)=>a+b,0); if(!total) return []
    let a = -Math.PI/2
    return vals.map(v => {
      const ang=v/total*2*Math.PI, ea=a+ang, r=44
      const x1=50+r*Math.cos(a),y1=50+r*Math.sin(a),x2=50+r*Math.cos(ea),y2=50+r*Math.sin(ea)
      const d=`M50,50 L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r},0,${ang>Math.PI?1:0},1,${x2.toFixed(1)},${y2.toFixed(1)} Z`
      a=ea; return d
    })
  }
  const pies   = buildPie([protCal, carbCal, fatCal])
  const colors = ['#EF4444','#F59E0B','#2DD4BF']
  const macros = [
    { label:'Proteína',    val:totals.prot||0, goal:goals.protein, color:'#EF4444', cal:protCal, min:1.6, max:2.2 },
    { label:'Carboidrato', val:totals.carb||0, goal:goals.carbs,   color:'#F59E0B', cal:carbCal, min:3,   max:6   },
    { label:'Gordura',     val:totals.fat||0,  goal:goals.fat,     color:'#2DD4BF', cal:fatCal,  min:0.8, max:1.2 },
  ]
  const kcalPct = pct(totals.cal||0, goals.calories)

  return (
    <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div>
          <span style={{ fontSize:26, fontWeight:800, color:'var(--t1)' }}>{Math.round(totals.cal||0)}</span>
          <span style={{ fontSize:12, color:'var(--t3)', marginLeft:4 }}>kcal</span>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>Meta: {goals.calories} · {kcalPct}%</div>
        </div>
        {weight && <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--accent)' }}>{weight}kg</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>seu peso</div>
        </div>}
      </div>
      <div style={{ height:6, background:'var(--b1)', borderRadius:99, marginBottom:16, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${kcalPct}%`, background:'var(--accent)', borderRadius:99, transition:'width .4s' }} />
      </div>

      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <svg width="90" height="90" viewBox="0 0 100 100" style={{ flexShrink:0 }}>
          {pies.length ? pies.map((d,i) => <path key={i} d={d} fill={colors[i]} />) : <circle cx="50" cy="50" r="44" fill="var(--b1)" />}
          <circle cx="50" cy="50" r="30" fill="var(--card)" />
          <text x="50" y="47" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{Math.round(totals.cal||0)}</text>
          <text x="50" y="58" textAnchor="middle" fill="#4B5563" fontSize="8">kcal</text>
        </svg>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9 }}>
          {macros.map(m => {
            const p = pct(m.val, m.goal)
            const gk = weight ? m.val/weight : null
            return (
              <div key={m.label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:m.color, flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'var(--t1)' }}>{Math.round(m.val)}g <span style={{ color:'var(--t3)', fontWeight:400, fontSize:9 }}>/{m.goal}g</span></span>
                </div>
                <div style={{ height:5, background:'var(--b1)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${p}%`, background:m.color, borderRadius:99, transition:'width .4s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                  {gk !== null && <span style={{ fontSize:9, color:'var(--t3)' }}><span style={{ color:m.color, fontWeight:700 }}>{gk.toFixed(2)}</span>g/kg</span>}
                  <span style={{ fontSize:9, color:'var(--t3)', marginLeft:'auto' }}>{Math.round(m.cal/macTotal*100)}% kcal</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {weight && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--b1)', display:'flex', gap:6 }}>
          {macros.map(m => {
            const gk = m.val/weight, ok=gk>=m.min&&gk<=m.max, low=gk<m.min
            return (
              <div key={m.label} style={{ flex:1, background:'var(--bg3)', borderRadius:'var(--rsm)', padding:'8px 6px', border:`1px solid ${ok?m.color+'44':'var(--b1)'}`, textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--t3)', fontWeight:700, marginBottom:3 }}>{m.label.slice(0,4)}</div>
                <div style={{ fontSize:13, fontWeight:800, color:ok?m.color:low?'var(--orange)':'var(--red)' }}>{gk.toFixed(2)}</div>
                <div style={{ fontSize:8, color:'var(--t3)' }}>{m.min}–{m.max}</div>
                <div style={{ fontSize:8, fontWeight:700, marginTop:2, color:ok?'var(--green)':low?'var(--orange)':'var(--red)' }}>{ok?'✓ Ideal':low?'↑ Baixo':'↓ Alto'}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MEAL CARD
───────────────────────────────────────────── */
function MealCard({ meal, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [del,  setDel]  = useState(false)
  const items  = meal.items || []
  const totals = sumMacros(items)

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:'100%', padding:'13px 14px', display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontSize:12, color:'var(--t3)' }}>☰</span>
        <span style={{ fontSize:22 }}>{meal.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>{meal.name}</div>
          <div style={{ color:'var(--t3)', fontSize:11, marginTop:2 }}>
            <span style={{ color:'var(--accent)', fontWeight:700 }}>{Math.round(totals.cal)} kcal</span>
            {' · '}P:{Math.round(totals.prot)}g · C:{Math.round(totals.carb)}g · G:{Math.round(totals.fat)}g
          </div>
        </div>
        <span style={{ color:'var(--t3)', fontSize:16, transform:open?'rotate(180deg)':'none', transition:'.2s' }}>⌄</span>
      </button>

      {open && (
        <div style={{ borderTop:'1px solid var(--b1)' }}>
          {items.length === 0
            ? <p style={{ padding:'10px 14px', color:'var(--t3)', fontSize:12 }}>Nenhum alimento</p>
            : items.map(item => (
                <div key={item.id} style={{ padding:'7px 14px', display:'flex', justifyContent:'space-between', fontSize:12, borderBottom:'1px solid var(--b2)' }}>
                  <span style={{ color:'var(--t2)' }}>{item.food_name} — {item.amount}{item.unit}</span>
                  <span style={{ color:'var(--t3)', flexShrink:0, marginLeft:8 }}>{Math.round(item.calories||0)} kcal</span>
                </div>
              ))
          }
          <div style={{ display:'flex', borderTop:'1px solid var(--b1)' }}>
            <button onClick={() => setDel(true)} style={{ flex:1, padding:'9px', fontSize:12, color:'var(--red)', background:'none', border:'none', borderRight:'1px solid var(--b1)', cursor:'pointer' }}>🗑️ Excluir</button>
            <button onClick={onEdit} style={{ flex:1, padding:'9px', fontSize:12, fontWeight:700, color:'var(--accent)', background:'var(--accent10)', border:'none', cursor:'pointer' }}>✏️ Editar</button>
          </div>
        </div>
      )}
      {del && <Confirm message={`Excluir "${meal.name}"?`} onConfirm={onDelete} onCancel={() => setDel(false)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MEAL EDITOR (with drag-and-drop items)
───────────────────────────────────────────── */
function MealEditor({ meal, plan, userId, onSave, onBack }) {
  const { toast } = useApp()
  const [name,     setName]     = useState(meal?.name || '')
  const [icon,     setIcon]     = useState(meal?.icon || '🍽️')
  const [items,    setItems]    = useState(meal?.items || [])
  const [saving,   setSaving]   = useState(false)
  const [addFood,  setAddFood]  = useState(false)
  const [presets,  setPresets]  = useState(false)

  const { onDragStart, onDragOver, onDragEnd } = useDragSort(items, setItems)
  const totals = sumMacros(items)

  const save = async () => {
    if (!name.trim()) return toast('Dê um nome à refeição.')
    setSaving(true)
    try {
      const rows = items.map((item, i) => ({
        food_name:item.food_name, amount:item.amount, unit:item.unit,
        calories:item.calories, protein:item.protein, carbs:item.carbs, fat:item.fat,
        sort_order:i, sub_group:null, sub_option:null, sub_name:null, sub_icon:null,
      }))
      if (meal) {
        await mealService.update(meal.id, { name, icon })
        await mealItemService.replaceItems(meal.id, userId, rows)
      } else {
        const nm = await mealService.create(plan.id, userId, { name, icon, sort_order:999 })
        if (rows.length) await mealItemService.replaceItems(nm.id, userId, rows)
      }
      await onSave()
    } catch(e) { toast('Erro: '+e.message) } finally { setSaving(false) }
  }

  const removeItem = idx => setItems(p => p.filter((_,i)=>i!==idx))
  const updateItem = (idx, fields) => setItems(p => p.map((x,i)=>i===idx?{...x,...fields}:x))

  return (
    <div className="screen">
      <div className="screen-header">
        <button onClick={onBack} style={{ color:'var(--accent)', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>← Voltar</button>
        <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:13 }} onClick={save} disabled={saving}>
          {saving ? '⏳' : '✅ Salvar'}
        </button>
      </div>

      <div style={{ padding:'0 16px 16px' }}>
        {/* Name + icon */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <select value={icon} onChange={e => setIcon(e.target.value)}
            style={{ background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'10px', fontSize:22, width:56 }}>
            {MEAL_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input className="inp" placeholder="Nome da refeição" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Totals */}
        <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:'var(--r)', marginBottom:14, display:'flex', gap:14, fontSize:13, flexWrap:'wrap' }}>
          <span>🔥 <b style={{ color:'var(--accent)' }}>{Math.round(totals.cal)}</b> kcal</span>
          <span>💪 <b style={{ color:'#EF4444' }}>{Math.round(totals.prot)}g</b> P</span>
          <span>🌾 <b style={{ color:'#F59E0B' }}>{Math.round(totals.carb)}g</b> C</span>
          <span>🥑 <b style={{ color:'#2DD4BF' }}>{Math.round(totals.fat)}g</b> G</span>
        </div>

        {/* Items with drag */}
        {items.length > 0 && (
          <div style={{ marginBottom:8 }}>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:6 }}>☰ Arraste para reordenar</p>
            {items.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                style={{ userSelect:'none' }}
              >
                <FoodItemRow item={item} onChange={f => updateItem(i, f)} onRemove={() => removeItem(i)} />
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => setAddFood(true)}
            style={{ padding:'12px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--t2)', fontSize:13, fontWeight:600, background:'none', cursor:'pointer' }}>
            + Adicionar alimento
          </button>
          <button onClick={() => setPresets(true)}
            style={{ padding:'12px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--accent)', fontSize:13, fontWeight:600, background:'none', cursor:'pointer' }}>
            ⚡ Usar preset de refeição
          </button>
        </div>
      </div>

      {addFood  && <FoodPicker onClose={() => setAddFood(false)}  onAdd={fi => { setItems(p=>[...p,{...fi}]); setAddFood(false) }} />}
      {presets  && <PresetPicker onClose={() => setPresets(false)} onSelect={p => { setName(n=>n||p.name); setIcon(p.icon||icon); setItems(p.foods.map(f=>({...f}))); setPresets(false) }} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   FOOD ITEM ROW
───────────────────────────────────────────── */
function FoodItemRow({ item, onChange, onRemove }) {
  const fd    = findFood(item.food_name)
  const units = fd ? [fd.u,...(fd.alt||[])].filter((v,i,a)=>a.indexOf(v)===i) : [item.unit||'g']

  const handle = (amount, unit) => {
    const a=parseFloat(amount)||0, u=unit||item.unit
    if (fd) {
      const m=calcMacros(fd,a,u)
      onChange({ amount:a, unit:u, calories:m.cal, protein:m.prot, carbs:m.carb, fat:m.fat })
    } else {
      const r=item.amount>0?a/item.amount:0
      onChange({ amount:a, unit:u, calories:+(item.calories*r).toFixed(1), protein:+(item.protein*r).toFixed(1), carbs:+(item.carbs*r).toFixed(1), fat:+(item.fat*r).toFixed(1) })
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--b2)', cursor:'grab' }}>
      <span style={{ fontSize:12, color:'var(--t3)', flexShrink:0 }}>☰</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--t1)' }}>{item.food_name}</div>
        <div style={{ fontSize:10, color:'var(--t3)' }}>{Math.round(item.calories||0)} kcal · {Math.round(item.protein||0)}g P</div>
      </div>
      <input type="number" value={item.amount} onChange={e => handle(e.target.value, item.unit)}
        style={{ width:58, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'6px', fontSize:13, textAlign:'center' }}
        inputMode="decimal" />
      <select value={item.unit} onChange={e => handle(item.amount, e.target.value)}
        style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t2)', padding:'6px 4px', fontSize:12 }}>
        {units.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <button onClick={onRemove} style={{ color:'var(--red)', fontSize:16, flexShrink:0, background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>✕</button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   FOOD PICKER
───────────────────────────────────────────── */
function FoodPicker({ onClose, onAdd }) {
  const { userId, toast } = useApp()
  const [query,      setQuery]      = useState('')
  const [amount,     setAmount]     = useState('100')
  const [unit,       setUnit]       = useState('g')
  const [picked,     setPicked]     = useState(null)
  const [creating,   setCreating]   = useState(false)  // modo "novo alimento"
  const [newFood,    setNewFood]    = useState({ name:'', unit:'g', cal:'', prot:'', carb:'', fat:'' })
  const [saving,     setSaving]     = useState(false)
  const [customFoods,setCustomFoods]= useState([])

  useEffect(() => {
    // Carregar alimentos customizados do usuário
    import('../services/diet').then(m => {
      m.foodService.listCustom(userId).then(list => setCustomFoods(list)).catch(() => {})
    })
  }, [userId])

  const results = searchFoods(query, customFoods)
  const units   = picked ? getFoodUnits(picked) : ['g','ml','unid']

  const selectFood = name => {
    const fd = findFood(name)
    const cu = customFoods.find(f => f.name === name)
    setPicked(name)
    setUnit(fd?.u || cu?.default_unit || 'g')
    setAmount((fd?.u || cu?.default_unit) === 'unid' ? '1' : '100')
    setCreating(false)
  }

  const confirm = () => {
    if (!picked) return
    const fd = findFood(picked)
    const cu = customFoods.find(f => f.name === picked)
    const a = parseFloat(amount) || 0
    let m = { cal:0, prot:0, carb:0, fat:0 }
    if (fd) {
      const mc = calcMacros(fd, a, unit)
      m = { cal: mc.cal, prot: mc.prot, carb: mc.carb, fat: mc.fat }
    } else if (cu) {
      const factor = unit === 'unid' ? a : a / 100
      m = {
        cal:  +(cu.calories  * factor).toFixed(1),
        prot: +(cu.protein   * factor).toFixed(1),
        carb: +(cu.carbs     * factor).toFixed(1),
        fat:  +(cu.fat       * factor).toFixed(1),
      }
    }
    onAdd({ food_name: picked, amount: a, unit, calories: m.cal, protein: m.prot, carbs: m.carb, fat: m.fat })
  }

  const saveCustomFood = async () => {
    if (!newFood.name.trim()) return toast('Digite o nome do alimento.')
    if (!newFood.cal) return toast('Informe as calorias.')
    setSaving(true)
    try {
      const { foodService } = await import('../services/diet')
      const saved = await foodService.create(userId, {
        name: newFood.name.trim(),
        calories: parseFloat(newFood.cal) || 0,
        protein:  parseFloat(newFood.prot) || 0,
        carbs:    parseFloat(newFood.carb) || 0,
        fat:      parseFloat(newFood.fat) || 0,
        default_unit: newFood.unit,
      })
      setCustomFoods(p => [...p, saved])
      toast('✅ Alimento cadastrado!')
      // Selecionar automaticamente o alimento recém-criado
      setPicked(saved.name)
      setQuery(saved.name)
      setUnit(saved.default_unit)
      setAmount(saved.default_unit === 'unid' ? '1' : '100')
      setCreating(false)
    } catch(e) { toast('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  if (creating) {
    return (
      <Modal title="Novo Alimento" onClose={() => setCreating(false)}>
        <p style={{ fontSize:12, color:'var(--t3)', marginBottom:14, lineHeight:1.5 }}>
          Informe os macros referentes a <b style={{ color:'var(--t2)' }}>100g / 100ml</b> ou <b style={{ color:'var(--t2)' }}>1 unidade</b>.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          <input className="inp" placeholder="Nome do alimento (ex: Salada de quinoa)" value={newFood.name}
            onChange={e => setNewFood(f=>({...f,name:e.target.value}))} autoFocus />

          <div>
            <p className="label" style={{ marginBottom:8 }}>Unidade padrão</p>
            <div style={{ display:'flex', gap:8 }}>
              {['g','ml','unid'].map(u => (
                <button key={u} onClick={() => setNewFood(f=>({...f,unit:u}))}
                  style={{ flex:1, padding:'9px', borderRadius:'var(--rsm)', fontWeight:700, fontSize:13, cursor:'pointer',
                    background: newFood.unit===u ? 'var(--accent)' : 'var(--bg3)',
                    border: `1.5px solid ${newFood.unit===u ? 'var(--accent)' : 'var(--b1)'}`,
                    color: newFood.unit===u ? '#fff' : 'var(--t2)' }}>
                  {u==='g'?'Gramas':u==='ml'?'Mililitros':'Unidade'}
                </button>
              ))}
            </div>
            <p style={{ fontSize:11, color:'var(--t3)', marginTop:6 }}>
              {newFood.unit === 'unid' ? 'Macros por 1 unidade' : `Macros por 100${newFood.unit}`}
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5, color:'var(--accent)' }}>Calorias</label>
              <input className="inp" type="number" inputMode="decimal" placeholder="ex: 180"
                value={newFood.cal} onChange={e => setNewFood(f=>({...f,cal:e.target.value}))}
                style={{ borderColor:'rgba(59,130,246,.4)' }} />
            </div>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5, color:'#EF4444' }}>Proteína (g)</label>
              <input className="inp" type="number" inputMode="decimal" placeholder="ex: 6"
                value={newFood.prot} onChange={e => setNewFood(f=>({...f,prot:e.target.value}))}
                style={{ borderColor:'rgba(239,68,68,.4)' }} />
            </div>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5, color:'#F59E0B' }}>Carboidratos (g)</label>
              <input className="inp" type="number" inputMode="decimal" placeholder="ex: 22"
                value={newFood.carb} onChange={e => setNewFood(f=>({...f,carb:e.target.value}))}
                style={{ borderColor:'rgba(245,158,11,.4)' }} />
            </div>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5, color:'#2DD4BF' }}>Gordura (g)</label>
              <input className="inp" type="number" inputMode="decimal" placeholder="ex: 7"
                value={newFood.fat} onChange={e => setNewFood(f=>({...f,fat:e.target.value}))}
                style={{ borderColor:'rgba(45,212,191,.4)' }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setCreating(false)}>Voltar</button>
            <button className="btn btn-primary btn-full" onClick={saveCustomFood} disabled={saving}>
              {saving ? '⏳ Salvando...' : '✅ Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Adicionar Alimento" onClose={onClose}>
      <input className="inp" placeholder="Buscar alimento..." value={query}
        onChange={e => { setQuery(e.target.value); setPicked(null) }} autoFocus style={{ marginBottom:10 }} />
      {!picked && query.length >= 1 && (
        <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid var(--b1)', borderRadius:'var(--r)', marginBottom:10 }}>
          {results.length === 0 ? (
            <div>
              <p style={{ padding:'10px 14px', color:'var(--t3)', fontSize:13 }}>Nenhum resultado para "{query}"</p>
              <button
                onClick={() => { setNewFood(f=>({...f, name:query})); setCreating(true) }}
                style={{ width:'100%', padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:700,
                  color:'var(--accent)', background:'var(--accent10)', border:'none', borderTop:'1px solid var(--b1)', cursor:'pointer' }}>
                + Cadastrar "{query}" como novo alimento
              </button>
            </div>
          ) : (
            <>
              {results.map(r => (
                <button key={r.name} onClick={() => { selectFood(r.name); setQuery(r.name) }}
                  style={{ width:'100%', padding:'10px 14px', textAlign:'left', fontSize:13, color:'var(--t1)', background:'none', border:'none', borderBottom:'1px solid var(--b2)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span>{r.name}</span>
                  {r.isCustom && <span style={{ fontSize:10, color:'var(--accent)', fontWeight:700, background:'var(--accent10)', padding:'2px 7px', borderRadius:99 }}>seu</span>}
                </button>
              ))}
              <button
                onClick={() => { setNewFood(f=>({...f, name:query})); setCreating(true) }}
                style={{ width:'100%', padding:'9px 14px', textAlign:'left', fontSize:12, fontWeight:700,
                  color:'var(--teal)', background:'rgba(45,212,191,.06)', border:'none', borderTop:'1px solid var(--b1)', cursor:'pointer' }}>
                + Cadastrar "{query}" como novo alimento
              </button>
            </>
          )}
        </div>
      )}
      {picked && (
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <input type="number" className="inp" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex:1 }} inputMode="decimal" />
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'11px 10px', fontSize:14 }}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary btn-full" onClick={confirm} disabled={!picked}>Adicionar</button>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   PRESET PICKER
───────────────────────────────────────────── */
function PresetPicker({ onClose, onSelect }) {
  return (
    <Modal title="Preset de Refeição" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {Object.entries(MEAL_PRESETS).map(([catKey, cat]) => (
          <div key={catKey} style={{ marginBottom:8 }}>
            <p className="label" style={{ marginBottom:6 }}>{cat.icon} {cat.label}</p>
            {cat.options.map(opt => (
              <button key={opt.key} onClick={() => onSelect(opt)}
                style={{ width:'100%', padding:'10px 12px', marginBottom:5, textAlign:'left', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <span style={{ fontSize:18 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--t1)' }}>{opt.name}</div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>
                    {Math.round(sumMacros(opt.foods).cal)} kcal · {Math.round(sumMacros(opt.foods).prot)}g prot
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   GOALS EDITOR
───────────────────────────────────────────── */
function GoalsEditor({ goals, userId, profile, onSave, onBack, refreshProfile }) {
  const { toast } = useApp()
  const [form,   setForm]   = useState({ ...goals })
  const [weight, setWeight] = useState(String(profile?.weight||''))
  const [height, setHeight] = useState(String(profile?.height||''))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        dietGoalsService.upsert(userId, { calories:parseInt(form.calories), protein:parseInt(form.protein), carbs:parseInt(form.carbs), fat:parseInt(form.fat) }),
        profileService.upsert(userId, { weight:parseFloat(weight)||null, height:parseFloat(height)||null }),
      ])
      await refreshProfile()
      onSave(form)
    } catch(e) { toast('Erro: '+e.message) } finally { setSaving(false) }
  }

  const auto = () => {
    const kg=parseFloat(weight)||0
    if (!kg) return toast('Preencha seu peso primeiro.')
    const g=smartGoals(parseInt(form.calories)||2800, kg)
    setForm(g); toast('Macros calculados!')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button onClick={onBack} style={{ color:'var(--accent)', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>← Voltar</button>
        <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:13 }} onClick={save} disabled={saving}>{saving?'⏳':'Salvar'}</button>
      </div>
      <div style={{ padding:'8px 16px' }}>
        <h2 style={{ fontSize:19, fontWeight:700, marginBottom:4, color:'var(--t1)' }}>Metas & Dados Pessoais</h2>
        <p style={{ color:'var(--t3)', fontSize:13, marginBottom:20, lineHeight:1.5 }}>Peso usado para calcular g/kg e referências de macros.</p>

        <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:14, marginBottom:14 }}>
          <p className="label" style={{ marginBottom:12 }}>Dados Pessoais</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5 }}>Peso (kg)</label>
              <input className="inp" type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="80" inputMode="decimal" />
            </div>
            <div>
              <label className="label" style={{ display:'block', marginBottom:5 }}>Altura (cm)</label>
              <input className="inp" type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="175" inputMode="decimal" />
            </div>
          </div>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:14 }}>
          <p className="label" style={{ marginBottom:12 }}>Metas Nutricionais</p>
          <div style={{ marginBottom:12 }}>
            <label className="label" style={{ display:'block', marginBottom:5 }}>Calorias (kcal)</label>
            <input className="inp" type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} inputMode="numeric" />
          </div>
          <button onClick={auto} className="btn btn-ghost btn-full" style={{ fontSize:13, marginBottom:14 }}>
            🧮 Calcular macros pelo peso automaticamente
          </button>
          {[
            { label:'Proteína (g)', key:'protein', color:'#EF4444' },
            { label:'Carboidratos (g)', key:'carbs', color:'#F59E0B' },
            { label:'Gordura (g)', key:'fat', color:'#2DD4BF' },
          ].map(({ label, key, color }) => (
            <div key={key} style={{ marginBottom:12 }}>
              <label className="label" style={{ display:'block', marginBottom:5, color }}>{label}</label>
              <input className="inp" type="number" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} inputMode="numeric" style={{ borderColor:color+'44' }} />
              {weight && form[key] && (
                <p style={{ fontSize:11, color:'var(--t3)', marginTop:4 }}>→ {(parseFloat(form[key])/parseFloat(weight)).toFixed(2)} g/kg</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
