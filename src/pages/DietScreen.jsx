import { useState, useEffect, useRef } from 'react'
import { useApp } from '../hooks/useAppContext'
import { mealPlanService, mealService, mealItemService, dietGoalsService, foodService, presetService } from '../services/diet'
import { profileService } from '../services/profile'
import { searchFoods, calcMacros, findFood, getFoodUnits, MEAL_PRESETS, recalcItems } from '../utils/foodsDb'
import { sumMacros, MEAL_ICONS, smartGoals } from '../utils/helpers'
import { Modal, FormSheet, Confirm, Loader, Empty, SectionHeader, SheetPicker } from '../components/UI'
import { useDragSort } from '../hooks/useDragSort'

const DISH_ICONS = ['🍽️','🥣','🍳','🫓','🍚','🍝','🥗','🐟','🥤','🥛','🌯','🍠','🥪','🍞','🧇','🍛','🍲','🥩','🍗','🍕']

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function DietScreen() {
  const { userId, profile, refreshProfile, toast } = useApp()
  const [plan,        setPlan]        = useState(null)
  const [meals,       setMeals]       = useState([])
  const [goals,       setGoals]       = useState({ calories:2800, protein:180, carbs:350, fat:80 })
  const [customFoods, setCustomFoods] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState('plan')
  const [editMeal,    setEditMeal]    = useState(null)

  useEffect(() => { if (userId) load() }, [userId])

  const load = async () => {
    try {
      const [g, p, cf] = await Promise.all([
        dietGoalsService.get(userId),
        mealPlanService.getActive(userId),
        foodService.listCustom(userId),
      ])
      setGoals(g)
      setCustomFoods(cf)
      if (p) { setPlan(p); setMeals(await loadMeals(p.id, cf)) }
      else   { const np = await mealPlanService.create(userId); setPlan(np); setMeals([]) }
    } finally { setLoading(false) }
  }

  const loadMeals = async (planId, cf) => {
    const ms = await mealService.listByPlan(planId)
    return ms.map(m => ({ ...m, items: recalcItems(m.items || [], cf) }))
  }

  const reloadCustomFoods = async () => setCustomFoods(await foodService.listCustom(userId))
  const reloadMeals = async () => setMeals(await loadMeals(plan.id, customFoods))

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(meals, async (next) => {
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
    <MealEditor meal={editMeal} plan={plan} userId={userId} customFoods={customFoods} onFoodCreated={reloadCustomFoods}
      onSave={async () => { await reloadMeals(); setView('plan') }}
      onBack={() => setView('plan')} />
  )

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'var(--accent)', textTransform:'uppercase', marginBottom:2 }}>Nutrição</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'var(--t1)', lineHeight:1 }}>Minha Dieta</h2>
        </div>
        <button onClick={() => setView('goals')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'var(--accent10)', border:'1px solid var(--accent20)', borderRadius:'var(--rsm)', padding:'8px 12px', color:'var(--accent)', fontSize:12, fontWeight:700 }}>
          ⚙️ Metas
        </button>
      </div>

      {/* Macro summary */}
      <MacroSummary totals={totals} goals={goals} weight={weight} pct={pct} onGoals={() => setView('goals')} />

      {/* Meals */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 10px' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'var(--t3)', textTransform:'uppercase' }}>Refeições</div>
          {meals.length > 0 && <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>{meals.length} refeição{meals.length!==1?'es':''}</div>}
        </div>
        <button onClick={() => { setEditMeal(null); setView('editMeal') }}
          style={{ display:'flex', alignItems:'center', gap:5, background:'var(--accent)', borderRadius:'var(--rsm)', padding:'8px 14px', color:'#fff', fontSize:12, fontWeight:700, border:'none' }}>
          + Nova Refeição
        </button>
      </div>

      {meals.length === 0
        ? <Empty icon="🥗" title="Nenhuma refeição" description="Adicione refeições para montar sua dieta."
            action={() => { setEditMeal(null); setView('editMeal') }} actionLabel="+ Adicionar" />
        : (
          <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:12 }}>
            {meals.map((m, i) => (
              <div key={m.id} {...getItemProps(i)}>
                <MealCard
                  meal={m}
                  handleProps={getHandleProps(i)}
                  dragging={dragIndex === i}
                  onEdit={() => { setEditMeal(m); setView('editMeal') }}
                  onDelete={async () => { await mealService.delete(m.id); await reloadMeals(); toast('Refeição removida.') }}
                />
              </div>
            ))}
          </div>
        )
      }
      <div style={{ height:24 }} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   MACRO SUMMARY — redesigned premium card
───────────────────────────────────────────── */
function MacroSummary({ totals, goals, weight, pct, onGoals }) {
  const cal = totals.cal || 0
  const kcalPct = pct(cal, goals.calories)
  const kcalLeft = goals.calories - cal
  const protCal = (totals.prot||0)*4, carbCal = (totals.carb||0)*4, fatCal = (totals.fat||0)*9
  const macTotal = protCal+carbCal+fatCal || 1

  const macros = [
    { label:'Proteína',    key:'prot', val:totals.prot||0, goal:goals.protein, color:'#EF4444', cal:protCal, min:1.6, max:2.2 },
    { label:'Carboidrato', key:'carb', val:totals.carb||0, goal:goals.carbs,   color:'#F59E0B', cal:carbCal, min:3,   max:6   },
    { label:'Gordura',     key:'fat',  val:totals.fat||0,  goal:goals.fat,     color:'#2DD4BF', cal:fatCal,  min:0.8, max:1.2 },
  ]

  // Donut SVG segments
  const buildDonut = (vals, R=42, stroke=9) => {
    const total = vals.reduce((a,b)=>a+b,0); if(!total) return []
    const circ = 2*Math.PI*R; let off = 0
    return vals.map((v,i) => {
      const dash = v/total*circ
      const seg = { dash, gap:circ-dash, offset:off, color:macros[i].color }
      off += dash; return seg
    })
  }
  const segs = buildDonut([protCal, carbCal, fatCal])
  const R=42, CX=50, CY=50, circ=2*Math.PI*R

  return (
    <div style={{ margin:'0 14px 6px' }}>
      {/* Main kcal card */}
      <div style={{ background:'linear-gradient(135deg, #0c0c1c 0%, #0e0e20 100%)', border:'1px solid var(--b1)', borderRadius:'var(--rlg)', padding:'18px 20px 16px', marginBottom:10, position:'relative', overflow:'hidden' }}>
        {/* Accent glow */}
        <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Consumido hoje</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:42, fontWeight:900, color:'var(--t1)', lineHeight:1, letterSpacing:'-1px' }}>{Math.round(cal)}</span>
              <span style={{ fontSize:14, color:'var(--t3)', fontWeight:600 }}>kcal</span>
            </div>
            <div style={{ fontSize:12, color: kcalPct >= 100 ? '#10B981' : kcalLeft > 0 ? 'var(--t3)' : 'var(--orange)', marginTop:4 }}>
              {kcalPct >= 100 ? '✓ Meta atingida' : `Faltam ${Math.round(Math.max(0,kcalLeft))} kcal`}
            </div>
          </div>

          {/* Donut */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <svg width="84" height="84" viewBox="0 0 100 100">
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--b1)" strokeWidth="9" />
              {segs.length ? segs.map((s,i) => (
                <circle key={i} cx={CX} cy={CY} r={R} fill="none"
                  stroke={s.color} strokeWidth="9"
                  strokeDasharray={`${s.dash.toFixed(2)} ${s.gap.toFixed(2)}`}
                  strokeDashoffset={-s.offset + circ/4}
                  style={{ transition:'stroke-dasharray .5s' }} />
              )) : null}
              <text x={CX} y={CY-4} textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{kcalPct}%</text>
              <text x={CX} y={CY+9} textAnchor="middle" fill="#4B5563" fontSize="8">meta</text>
            </svg>
          </div>
        </div>

        {/* Kcal progress bar */}
        <div style={{ height:5, background:'var(--b1)', borderRadius:99, overflow:'hidden', marginBottom:16 }}>
          <div style={{ height:'100%', width:`${kcalPct}%`, background:`linear-gradient(90deg, #3B82F6, ${kcalPct>=100?'#10B981':'#818CF8'})`, borderRadius:99, transition:'width .5s' }} />
        </div>

        {/* Macro bars */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {macros.map(m => {
            const p = pct(m.val, m.goal)
            return (
              <div key={m.label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:m.color }} />
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--t2)' }}>{m.label}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--t1)' }}>{Math.round(m.val)}g</span>
                    <span style={{ fontSize:10, color:'var(--t3)' }}>/ {m.goal}g</span>
                    <span style={{ fontSize:10, color:'var(--t3)', marginLeft:4 }}>{p}%</span>
                  </div>
                </div>
                <div style={{ height:5, background:'var(--b1)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${p}%`, background:m.color, borderRadius:99, transition:'width .5s', opacity:0.9 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Macro chips row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {macros.map(m => {
          const gk = weight ? m.val/weight : null
          const ok = gk!==null && gk>=m.min && gk<=m.max
          const low = gk!==null && gk<m.min
          return (
            <div key={m.label} style={{
              background:'var(--card)', borderRadius:'var(--r)', padding:'12px 10px',
              border:`1px solid ${gk!==null&&ok ? m.color+'44' : 'var(--b1)'}`,
              textAlign:'center', position:'relative', overflow:'hidden'
            }}>
              {gk!==null && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:ok?m.color:low?'var(--orange)':'var(--red)' }} />}
              <div style={{ fontSize:18, fontWeight:900, color:m.color, letterSpacing:'-0.5px' }}>{Math.round(m.val)}<span style={{ fontSize:10, fontWeight:600, color:'var(--t3)' }}>g</span></div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, fontWeight:600 }}>{m.label}</div>
              {gk !== null && (
                <div style={{ fontSize:10, fontWeight:700, marginTop:4, color:ok?m.color:low?'var(--orange)':'var(--red)' }}>
                  {gk.toFixed(2)}g/kg
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MEAL CARD — premium hierarchical layout
───────────────────────────────────────────── */
function MealCard({ meal, onEdit, onDelete, handleProps, dragging }) {
  const [open, setOpen] = useState(false)
  const [del,  setDel]  = useState(false)
  const items   = meal.items || []
  const totals  = sumMacros(items)
  const groups   = groupItemsBySubName(items)
  const hasOpts  = groups.some(g => g.subName)
  const firstDishIdx = groups.findIndex(g => g.subName)

  return (
    <div className={dragging ? 'drag-ghost' : ''} style={{
      background:'var(--card)', borderRadius:'var(--rlg)',
      border:`1px solid ${open ? 'var(--accent)33' : 'var(--b1)'}`,
      overflow:'hidden',
      boxShadow: open ? '0 4px 24px rgba(59,130,246,0.08)' : 'none',
      transition:'border-color .2s, box-shadow .2s'
    }}>
      {/* Meal header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 14px 14px 10px' }}>
        <span {...handleProps} style={{ ...handleProps?.style, fontSize:15, color:'var(--t4)', padding:'6px 3px', flexShrink:0 }}>⠿</span>
        <button onClick={() => setOpen(o=>!o)}
          style={{ flex:1, display:'flex', alignItems:'center', gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0, minWidth:0 }}>
          {/* Icon circle */}
          <div style={{ width:42, height:42, borderRadius:12, background:'var(--accent10)', border:'1px solid var(--accent20)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
            {meal.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:15, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{meal.name}</div>
            {/* Show only the primary (first) prato when collapsed — simplified list view */}
            {!open && hasOpts && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                {(() => { const g = groups.find(g=>g.subName); return g ? (
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--accent)', background:'var(--accent10)', border:'1px solid var(--accent20)', borderRadius:99, padding:'1px 7px', whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>
                    {g.subIcon} {g.subName}
                  </span>
                ) : null })()}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop: (!open && hasOpts) ? 4 : 3 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{Math.round(totals.cal)} kcal</span>
              <span style={{ fontSize:11, color:'var(--b3)' }}>·</span>
              <span style={{ fontSize:11, color:'var(--t3)' }}>P:{Math.round(totals.prot)}g · C:{Math.round(totals.carb)}g · G:{Math.round(totals.fat)}g</span>
            </div>
          </div>
          <span style={{ color:'var(--t3)', fontSize:14, transform:open?'rotate(180deg)':'none', transition:'.2s', flexShrink:0 }}>⌄</span>
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop:'1px solid var(--b2)' }}>
          {items.length === 0 ? (
            <div style={{ padding:'16px 14px', color:'var(--t3)', fontSize:13 }}>Nenhum alimento cadastrado</div>
          ) : (
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {groups.map((group, gi) => {
                const gTotals = sumMacros(group.entries.map(e => e.item))
                if (!group.subName) {
                  // Plain ungrouped items
                  return (
                    <div key={gi} style={{ background:'var(--bg3)', borderRadius:'var(--r)', padding:'10px 12px', border:'1px solid var(--b2)' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {group.entries.map(({ item }) => (
                          <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--t3)', flexShrink:0 }} />
                              <span style={{ fontSize:13, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.food_name}</span>
                              <span style={{ fontSize:11, color:'var(--t3)', flexShrink:0 }}>{item.amount}{item.unit}</span>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:'var(--t2)', flexShrink:0 }}>{Math.round(item.calories||0)} kcal</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:10, paddingTop:8, borderTop:'1px solid var(--b2)', fontSize:11 }}>
                        <span style={{ color:'var(--accent)', fontWeight:700 }}>🔥 {Math.round(gTotals.cal)} kcal</span>
                        <span style={{ color:'#EF4444' }}>P:{Math.round(gTotals.prot)}g</span>
                        <span style={{ color:'#F59E0B' }}>C:{Math.round(gTotals.carb)}g</span>
                        <span style={{ color:'#2DD4BF' }}>G:{Math.round(gTotals.fat)}g</span>
                      </div>
                    </div>
                  )
                }

                // Grouped option/substitution — prominent nested card
                return (
                  <div key={gi} style={{
                    background:'var(--bg2)', borderRadius:'var(--r)',
                    border:'1px solid var(--b1)', borderLeft:'3px solid var(--accent)',
                    overflow:'hidden'
                  }}>
                    {/* Dish (prato) header */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--b2)', background:'var(--bg3)' }}>
                      {group.subIcon && <span style={{ fontSize:18 }}>{group.subIcon}</span>}
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{group.subName}</div>
                        <div style={{ fontSize:10, color: gi===firstDishIdx ? 'var(--orange)' : 'var(--accent)', fontWeight:600, marginTop:1 }}>{gi===firstDishIdx ? '⭐ prato principal' : 'prato'}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:13, fontWeight:800, color:'var(--accent)' }}>{Math.round(gTotals.cal)}</div>
                        <div style={{ fontSize:9, color:'var(--t3)' }}>kcal</div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                      {group.entries.map(({ item }) => (
                        <div key={item.id} style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', flexShrink:0, opacity:0.6 }} />
                          <span style={{ fontSize:12.5, color:'var(--t2)', flex:1 }}>{item.food_name}</span>
                          <span style={{ fontSize:11, color:'var(--t3)', flexShrink:0 }}>{item.amount}{item.unit}</span>
                          <span style={{ fontSize:11, color:'var(--t3)', flexShrink:0, marginLeft:4 }}>{Math.round(item.calories||0)} kcal</span>
                        </div>
                      ))}
                    </div>

                    {/* Macro footer */}
                    <div style={{ display:'flex', gap:0, borderTop:'1px solid var(--b2)', background:'var(--bg3)' }}>
                      {[
                        { l:'P', v:gTotals.prot, c:'#EF4444' },
                        { l:'C', v:gTotals.carb, c:'#F59E0B' },
                        { l:'G', v:gTotals.fat,  c:'#2DD4BF' },
                      ].map(({ l, v, c }, i) => (
                        <div key={l} style={{ flex:1, padding:'8px 0', textAlign:'center', borderRight:i<2?'1px solid var(--b2)':'none' }}>
                          <div style={{ fontSize:13, fontWeight:800, color:c }}>{Math.round(v)}g</div>
                          <div style={{ fontSize:9, color:'var(--t3)' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', borderTop:'1px solid var(--b1)' }}>
            <button onClick={() => setDel(true)}
              style={{ flex:1, padding:'11px', fontSize:12, color:'var(--red)', background:'none', border:'none', borderRight:'1px solid var(--b1)', cursor:'pointer', fontWeight:600 }}>
              🗑️ Excluir
            </button>
            <button onClick={onEdit}
              style={{ flex:1, padding:'11px', fontSize:12, fontWeight:700, color:'var(--accent)', background:'var(--accent10)', border:'none', cursor:'pointer' }}>
              ✏️ Editar refeição
            </button>
          </div>
        </div>
      )}

      {del && <Confirm message={`Excluir "${meal.name}"?`} onConfirm={onDelete} onCancel={() => setDel(false)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MEAL EDITOR
───────────────────────────────────────────── */
function MealEditor({ meal, plan, userId, customFoods, onFoodCreated, onSave, onBack }) {
  const { toast } = useApp()
  const [name,    setName]    = useState(meal?.name || '')
  const [icon,    setIcon]    = useState(meal?.icon || '🍽️')
  const [items,   setItems]   = useState(() => recalcItems(meal?.items || [], customFoods))
  const [saving,  setSaving]  = useState(false)
  const [addFood, setAddFood] = useState(false)
  const [presets, setPresets] = useState(false)
  const [copyFrom,setCopyFrom]= useState(null)
  const [iconPickFor, setIconPickFor] = useState(null)

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(items, setItems)
  const totals = sumMacros(items)

  const save = async () => {
    if (!name.trim()) return toast('Dê um nome à refeição.')
    setSaving(true)
    try {
      const rows = items.map((item, i) => ({
        food_name:item.food_name, amount:item.amount, unit:item.unit,
        calories:item.calories, protein:item.protein, carbs:item.carbs, fat:item.fat,
        sort_order:i, sub_group:null, sub_option:null,
        sub_name: item.sub_name || null, sub_icon: item.sub_icon || null,
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

  const groups = groupItemsBySubName(items)
  const firstDishIdx = groups.findIndex(g => g.subName)

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <button className="btn btn-primary" style={{ padding:'8px 18px', fontSize:13 }} onClick={save} disabled={saving}>
          {saving ? '⏳' : '✅ Salvar'}
        </button>
      </div>

      <div style={{ padding:'0 16px 16px' }}>
        {/* Name + icon */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <select value={icon} onChange={e => setIcon(e.target.value)}
            style={{ background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'10px', fontSize:22, width:56, flexShrink:0 }}>
            {MEAL_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input className="inp" placeholder="Nome da refeição" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Totals bar */}
        {items.length > 0 && (
          <div style={{ padding:'12px 16px', background:'var(--bg3)', borderRadius:'var(--r)', marginBottom:16, border:'1px solid var(--b1)' }}>
            <div style={{ display:'flex', gap:16, fontSize:13, flexWrap:'wrap' }}>
              <span>🔥 <b style={{ color:'var(--accent)' }}>{Math.round(totals.cal)}</b> kcal</span>
              <span>P: <b style={{ color:'#EF4444' }}>{Math.round(totals.prot)}g</b></span>
              <span>C: <b style={{ color:'#F59E0B' }}>{Math.round(totals.carb)}g</b></span>
              <span>G: <b style={{ color:'#2DD4BF' }}>{Math.round(totals.fat)}g</b></span>
            </div>
          </div>
        )}

        {/* Items grouped */}
        {items.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:8 }}>⠿ Arraste para reordenar</div>
            {groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: group.subName ? 10 : 0 }}>
                {group.subName && (
                  <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 4px 4px', borderLeft:'3px solid var(--accent)', paddingLeft:10, marginBottom:4, flexWrap:'wrap' }}>
                    <button onClick={() => setIconPickFor(group.subName)}
                      style={{ fontSize:16, background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>{group.subIcon || '🍽️'}</button>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)', flex:1 }}>{group.subName}</span>
                    {gi === firstDishIdx
                      ? <span style={{ fontSize:9.5, fontWeight:700, color:'var(--orange)', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:6, padding:'3px 6px', flexShrink:0 }}>⭐ principal</span>
                      : (
                        <button
                          onClick={() => setItems(p => moveGroupToFront(p, group.subName))}
                          title="Tornar este o prato principal desta refeição"
                          style={{ fontSize:12, padding:'3px 7px', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:6, color:'var(--t2)', cursor:'pointer', flexShrink:0 }}>⭐</button>
                      )
                    }
                    <button
                      onClick={() => {
                        const newName = window.prompt('Novo nome do prato:', group.subName)
                        if (newName && newName.trim()) {
                          setItems(p => p.map(it => it.sub_name === group.subName ? { ...it, sub_name: newName.trim() } : it))
                        }
                      }}
                      style={{ fontSize:12, padding:'3px 7px', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:6, color:'var(--t2)', cursor:'pointer', flexShrink:0 }}>✏️</button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover o prato "${group.subName}" e todos os seus ingredientes?`)) {
                          setItems(p => p.filter(it => it.sub_name !== group.subName))
                        }
                      }}
                      style={{ fontSize:12, padding:'3px 7px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'var(--red)', cursor:'pointer', flexShrink:0 }}>🗑️</button>
                  </div>
                )}
                <div style={{ paddingLeft: group.subName ? 12 : 0, borderLeft: group.subName ? '2px solid var(--accent20)' : 'none' }}>
                  {group.entries.map(({ item, index: i }) => (
                    <div key={i} {...getItemProps(i)}>
                      <FoodItemRow item={item} customFoods={customFoods}
                        onChange={f => updateItem(i, f)} onRemove={() => removeItem(i)}
                        handleProps={getHandleProps(i)} dragging={dragIndex === i} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {iconPickFor && (
          <SheetPicker title="Ícone do prato" options={DISH_ICONS}
            selected={items.find(it => it.sub_name === iconPickFor)?.sub_icon}
            onSelect={ic => setItems(p => p.map(it => it.sub_name === iconPickFor ? { ...it, sub_icon: ic } : it))}
            onClose={() => setIconPickFor(null)} />
        )}

        {/* Add buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => setAddFood(true)}
            style={{ padding:'13px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--t2)', fontSize:13, fontWeight:600, background:'none', cursor:'pointer' }}>
            + Adicionar alimento
          </button>
          <button onClick={() => setPresets(true)}
            style={{ padding:'13px', border:'1.5px dashed var(--accent)', borderRadius:'var(--r)', color:'var(--accent)', fontSize:13, fontWeight:600, background:'var(--accent10)', cursor:'pointer' }}>
            🍽️ Adicionar prato
          </button>
        </div>
      </div>

      {addFood && (
        <FoodPicker userId={userId} customFoods={customFoods} onFoodCreated={onFoodCreated}
          onClose={() => setAddFood(false)}
          onAdd={fi => { setItems(p=>[...p,{...fi}]); setAddFood(false) }} />
      )}
      {presets && (
        <PresetPicker
          userId={userId} customFoods={customFoods} onFoodCreated={onFoodCreated}
          onClose={() => setPresets(false)}
          onUse={preset => {
            const grouped = preset.foods.map(f => ({ ...f, sub_name: preset.name, sub_icon: preset.icon }))
            setItems(p => [...p, ...grouped])
            setPresets(false)
            toast(`"${preset.name}" adicionado!`)
          }}
        />
      )}
    </div>
  )
}

function groupItemsBySubName(items) {
  const groups = []
  let current = null
  items.forEach((item, index) => {
    const key = item.sub_name || null
    if (!current || current.subName !== key) {
      current = { subName: key, subIcon: item.sub_icon, entries: [] }
      groups.push(current)
    }
    current.entries.push({ item, index })
  })
  return groups
}

/** Move every item belonging to `subName` to the front of the list, making
 *  that prato the "principal" one (primary = first group, by convention —
 *  no extra DB field needed). Items without a sub_name, and other groups,
 *  keep their relative order after the moved block. */
function moveGroupToFront(items, subName) {
  const moved = items.filter(it => it.sub_name === subName)
  const rest  = items.filter(it => it.sub_name !== subName)
  return [...moved, ...rest]
}

/* ─────────────────────────────────────────────
   FOOD ITEM ROW
───────────────────────────────────────────── */
function FoodItemRow({ item, customFoods = [], onChange, onRemove, handleProps, dragging }) {
  const fd    = findFood(item.food_name, customFoods)
  const units = fd ? [fd.u,...(fd.alt||[])].filter((v,i,a)=>a.indexOf(v)===i) : [item.unit||'g']

  const handle = (amount, unit) => {
    const a=parseFloat(amount)||0, u=unit||item.unit
    if (fd) {
      const m=calcMacros(fd,a,u)
      onChange({ amount:a, unit:u, calories:m.cal, protein:m.prot, carbs:m.carb, fat:m.fat })
    } else {
      const r=item.amount>0?a/item.amount:0
      onChange({ amount:a, unit:u,
        calories:+(item.calories*r).toFixed(1), protein:+(item.protein*r).toFixed(1),
        carbs:+(item.carbs*r).toFixed(1), fat:+(item.fat*r).toFixed(1) })
    }
  }

  return (
    <div className={dragging ? 'drag-ghost' : ''} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 0', borderBottom:'1px solid var(--b2)' }}>
      <span {...handleProps} style={{ ...handleProps?.style, fontSize:16, color:'var(--t3)', flexShrink:0, padding:'6px 3px' }}>⠿</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--t1)' }}>{item.food_name}</div>
        <div style={{ fontSize:10, color:'var(--t3)', marginTop:1 }}>{Math.round(item.calories||0)} kcal · {Math.round(item.protein||0)}g P</div>
      </div>
      <input type="number" value={item.amount} onChange={e => handle(e.target.value, item.unit)}
        style={{ width:60, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'7px', fontSize:13, textAlign:'center' }}
        inputMode="decimal" />
      <select value={item.unit} onChange={e => handle(item.amount, e.target.value)}
        style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t2)', padding:'7px 5px', fontSize:12 }}>
        {units.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <button onClick={onRemove} style={{ color:'var(--red)', fontSize:16, flexShrink:0, background:'none', border:'none', cursor:'pointer', padding:'4px 6px' }}>✕</button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   FOOD PICKER
───────────────────────────────────────────── */
function FoodPicker({ userId, customFoods = [], onFoodCreated, onClose, onAdd }) {
  const { toast } = useApp()
  const [query,    setQuery]    = useState('')
  const [amount,   setAmount]   = useState('100')
  const [unit,     setUnit]     = useState('g')
  const [picked,   setPicked]   = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [newFood,  setNewFood]  = useState({ name:'', unit:'g', calories:'', protein:'', carbs:'', fat:'' })

  const results = searchFoods(query, customFoods)
  const units   = picked ? getFoodUnits(picked, customFoods) : ['g','ml','unid']

  const selectFood = name => {
    const fd=findFood(name, customFoods)
    setPicked(name); setUnit(fd?.u||'g'); setAmount(fd?.u==='unid'?'1':'100')
  }
  const confirm = () => {
    if (!picked) return
    const fd=findFood(picked, customFoods), a=parseFloat(amount)||0
    const m=fd?calcMacros(fd,a,unit):{cal:0,prot:0,carb:0,fat:0}
    onAdd({ food_name:picked, amount:a, unit, calories:m.cal, protein:m.prot, carbs:m.carb, fat:m.fat })
  }

  const openCreate = () => { setNewFood({ name:query, unit:'g', calories:'', protein:'', carbs:'', fat:'' }); setCreating(true) }

  const saveNewFood = async () => {
    if (!newFood.name.trim()) return toast('Dê um nome ao alimento.')
    setSaving(true)
    try {
      const created = await foodService.create(userId, {
        name: newFood.name.trim(),
        calories: parseFloat(newFood.calories) || 0,
        protein:  parseFloat(newFood.protein)  || 0,
        carbs:    parseFloat(newFood.carbs)    || 0,
        fat:      parseFloat(newFood.fat)      || 0,
        default_unit: newFood.unit,
      })
      await onFoodCreated?.()
      toast('✅ Alimento criado!')
      setCreating(false)
      setQuery(created.name)
      setPicked(created.name)
      setUnit(created.default_unit)
      setAmount(created.default_unit === 'unid' ? '1' : '100')
    } catch (e) { toast('Erro: ' + e.message) } finally { setSaving(false) }
  }

  if (creating) {
    return (
      <FormSheet title="Novo Alimento" onClose={() => setCreating(false)} onSave={saveNewFood} saving={saving} saveLabel="✅ Criar e usar">
        <input className="inp" placeholder="Nome do alimento" value={newFood.name}
          onChange={e => setNewFood(f => ({ ...f, name:e.target.value }))} autoFocus />
        <div>
          <p className="label" style={{ marginBottom:8 }}>Unidade padrão</p>
          <div style={{ display:'flex', gap:8 }}>
            {[{ v:'g', l:'Gramas' }, { v:'ml', l:'Mililitros' }, { v:'unid', l:'Unidade' }].map(o => (
              <button key={o.v} onClick={() => setNewFood(f => ({ ...f, unit:o.v }))}
                style={{ flex:1, padding:'9px 4px', fontSize:12, fontWeight:600, borderRadius:'var(--rsm)', cursor:'pointer',
                  background:newFood.unit===o.v?'var(--accent20)':'var(--bg3)',
                  border:`1.5px solid ${newFood.unit===o.v?'var(--accent)':'var(--b1)'}`,
                  color:newFood.unit===o.v?'var(--accent)':'var(--t2)' }}>{o.l}</button>
            ))}
          </div>
          <p style={{ fontSize:11, color:'var(--t3)', marginTop:6 }}>
            {newFood.unit === 'unid' ? 'Informe os macros para 1 unidade.' : `Informe os macros para 100${newFood.unit}.`}
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['Calorias (kcal)','calories','var(--accent)'],['Proteína (g)','protein','#EF4444'],['Carboidratos (g)','carbs','#F59E0B'],['Gordura (g)','fat','#2DD4BF']].map(([l,k,c]) => (
            <div key={k}>
              <label className="label" style={{ display:'block', marginBottom:5, color:c }}>{l}</label>
              <input className="inp" type="number" inputMode="decimal" value={newFood[k]}
                onChange={e => setNewFood(f => ({ ...f, [k]:e.target.value }))} style={{ borderColor:c+'44' }} />
            </div>
          ))}
        </div>
      </FormSheet>
    )
  }

  return (
    <FormSheet title="Adicionar Alimento" onClose={onClose} onSave={confirm} saveDisabled={!picked} saveLabel="Adicionar">
      <input className="inp" placeholder="Buscar alimento..." value={query}
        onChange={e => { setQuery(e.target.value); setPicked(null) }} autoFocus />
      {!picked && query.length >= 1 && (
        <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid var(--b1)', borderRadius:'var(--r)' }}>
          {results.length === 0
            ? <p style={{ padding:'10px 14px', color:'var(--t3)', fontSize:13 }}>Nenhum resultado para "{query}"</p>
            : results.map(r => (
                <button key={r.name} onClick={() => { selectFood(r.name); setQuery(r.name) }}
                  style={{ width:'100%', padding:'10px 14px', textAlign:'left', fontSize:13, color:'var(--t1)', background:'none', border:'none', borderBottom:'1px solid var(--b2)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <span>{r.name}</span>
                  {r.isCustom && <span style={{ fontSize:9, color:'var(--accent)', fontWeight:700, background:'var(--accent10)', borderRadius:99, padding:'1px 7px', flexShrink:0 }}>seu</span>}
                </button>
              ))
          }
        </div>
      )}
      {!picked && query.length >= 1 && (
        <button onClick={openCreate}
          style={{ width:'100%', padding:'11px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--accent)', fontSize:13, fontWeight:600, background:'none', cursor:'pointer' }}>
          + Cadastrar "{query}" como novo alimento
        </button>
      )}
      {picked && (
        <div style={{ display:'flex', gap:10 }}>
          <input type="number" className="inp" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex:1 }} inputMode="decimal" />
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'11px 10px', fontSize:14 }}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
    </FormSheet>
  )
}

/* ─────────────────────────────────────────────
   PRESET PICKER
───────────────────────────────────────────── */
function PresetPicker({ userId, customFoods, onFoodCreated, onClose, onUse }) {
  const { toast } = useApp()
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [del,     setDel]     = useState(null)

  useEffect(() => { load() }, [userId])
  const load = async () => {
    try { setPresets(await presetService.list(userId)) } finally { setLoading(false) }
  }

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(presets, async (next) => {
    setPresets(next)
    await presetService.reorder(next.map(p => p.id))
  })

  const duplicate = async (p, e) => {
    e.stopPropagation()
    try { const d = await presetService.duplicate(userId, p); setPresets(prev => [...prev, d]); toast('Prato duplicado!') }
    catch(err) { toast('Erro: '+err.message) }
  }

  const remove = async () => {
    try { await presetService.delete(del.id); setPresets(p => p.filter(x=>x.id!==del.id)); toast('Prato removido.') }
    finally { setDel(null) }
  }

  const suggestions = presets.length === 0
    ? Object.values(MEAL_PRESETS).flatMap(cat => cat.options.map(o => ({ ...o, _suggested:true })))
    : []

  if (editing) {
    return (
      <PresetEditor
        preset={editing === 'new' ? null : editing}
        userId={userId} customFoods={customFoods} onFoodCreated={onFoodCreated}
        onClose={() => setEditing(null)}
        onSaved={async () => { setEditing(null); await load() }}
      />
    )
  }

  return (
    <Modal title="Pratos desta Refeição" onClose={onClose}>
      <button onClick={() => setEditing('new')}
        style={{ width:'100%', padding:'13px', marginBottom:16, border:'1.5px dashed var(--accent)', borderRadius:'var(--r)', color:'var(--accent)', fontSize:13, fontWeight:700, background:'var(--accent10)', cursor:'pointer' }}>
        + Criar novo prato
      </button>

      {loading ? <Loader /> : (
        <>
          {presets.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: suggestions.length ? 18 : 0 }}>
              {presets.map((p, i) => {
                const m = sumMacros(p.foods || [])
                return (
                  <div key={p.id} {...getItemProps(i)} className={dragIndex===i ? 'drag-ghost' : ''}
                    style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:8, padding:'10px 10px 10px 6px' }}>
                    <span {...getHandleProps(i)} style={{ ...getHandleProps(i).style, fontSize:16, color:'var(--t3)', padding:'8px 4px' }}>⠿</span>
                    <button onClick={() => onUse(p)} style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'none', border:'none', textAlign:'left', cursor:'pointer', padding:0, minWidth:0 }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{p.icon}</span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--t3)' }}>{Math.round(m.cal)} kcal · {(p.foods||[]).length} itens</div>
                      </div>
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditing(p) }} style={{ color:'var(--t2)', fontSize:16, padding:7, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✏️</button>
                    <button onClick={e => duplicate(p, e)} style={{ color:'var(--t2)', fontSize:16, padding:7, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>📋</button>
                    <button onClick={e => { e.stopPropagation(); setDel(p) }} style={{ color:'var(--red)', fontSize:16, padding:7, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>🗑️</button>
                  </div>
                )
              })}
            </div>
          )}
          {presets.length === 0 && !loading && (
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:14 }}>
              Você ainda não tem pratos cadastrados. Crie um novo ou comece com uma sugestão:
            </p>
          )}
          {suggestions.map(opt => (
            <button key={opt.key} onClick={() => onUse(opt)}
              style={{ width:'100%', padding:'10px 12px', marginBottom:5, textAlign:'left', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <span style={{ fontSize:18 }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--t1)' }}>{opt.name}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{Math.round(sumMacros(opt.foods).cal)} kcal · {Math.round(sumMacros(opt.foods).prot)}g prot</div>
              </div>
            </button>
          ))}
        </>
      )}
      {del && <Confirm message={`Excluir o prato "${del.name}"?`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   PRESET EDITOR
───────────────────────────────────────────── */
function PresetEditor({ preset, userId, customFoods, onFoodCreated, onClose, onSaved }) {
  const { toast } = useApp()
  const [name,    setName]    = useState(preset?.name || '')
  const [icon,    setIcon]    = useState(preset?.icon || '🍱')
  const [foods,   setFoods]   = useState(() => recalcItems(preset?.foods || [], customFoods))
  const [addFood, setAddFood] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const { dragIndex, getHandleProps, getItemProps } = useDragSort(foods, setFoods)
  const totals = sumMacros(foods)

  const save = async () => {
    if (!name.trim()) return toast('Dê um nome ao prato.')
    if (!foods.length) return toast('Adicione pelo menos um alimento.')
    setSaving(true)
    try {
      if (preset) await presetService.update(preset.id, { name, icon, foods })
      else        await presetService.create(userId, { name, icon, foods })
      toast(preset ? 'Prato atualizado!' : 'Prato criado!')
      await onSaved()
    } catch(e) { toast('Erro: '+e.message) } finally { setSaving(false) }
  }

  return (
    <FormSheet title={preset ? 'Editar Prato' : 'Novo Prato'} onClose={onClose} onSave={save} saving={saving}
      saveLabel={preset ? 'Salvar alterações' : 'Criar prato'}>
      <div style={{ display:'flex', gap:10 }}>
        <select value={icon} onChange={e => setIcon(e.target.value)}
          style={{ background:'var(--bg3)', border:'1.5px solid var(--b1)', borderRadius:'var(--rsm)', color:'var(--t1)', padding:'10px', fontSize:22, width:56, flexShrink:0 }}>
          {MEAL_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
        </select>
        <input className="inp" placeholder="Nome do prato (ex: Mingau de Aveia)" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>

      {foods.length > 0 && (
        <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:'var(--r)', display:'flex', gap:14, fontSize:13 }}>
          <span>🔥 <b style={{ color:'var(--accent)' }}>{Math.round(totals.cal)}</b> kcal</span>
          <span>P: <b style={{ color:'#EF4444' }}>{Math.round(totals.prot)}g</b></span>
          <span>C: <b style={{ color:'#F59E0B' }}>{Math.round(totals.carb)}g</b></span>
          <span>G: <b style={{ color:'#2DD4BF' }}>{Math.round(totals.fat)}g</b></span>
        </div>
      )}

      {foods.length > 0 && (
        <div>
          {foods.map((item, i) => (
            <div key={i} {...getItemProps(i)}>
              <FoodItemRow item={item} customFoods={customFoods}
                onChange={f => setFoods(p => p.map((x,xi)=>xi===i?{...x,...f}:x))}
                onRemove={() => setFoods(p => p.filter((_,xi)=>xi!==i))}
                handleProps={getHandleProps(i)} dragging={dragIndex===i} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setAddFood(true)}
        style={{ padding:'13px', border:'1.5px dashed var(--b3)', borderRadius:'var(--r)', color:'var(--t2)', fontSize:13, fontWeight:600, background:'none', cursor:'pointer' }}>
        + Adicionar alimento ao prato
      </button>

      {addFood && (
        <FoodPicker userId={userId} customFoods={customFoods} onFoodCreated={onFoodCreated}
          onClose={() => setAddFood(false)}
          onAdd={fi => { setFoods(p => [...p, {...fi}]); setAddFood(false) }} />
      )}
    </FormSheet>
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
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:13 }} onClick={save} disabled={saving}>{saving?'⏳':'Salvar'}</button>
      </div>
      <div style={{ padding:'8px 16px' }}>
        <h2 style={{ fontSize:19, fontWeight:700, marginBottom:4 }}>Metas & Dados Pessoais</h2>
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
