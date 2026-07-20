import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../hooks/useAppContext'
import { measurementService } from '../services/diet'
import { todayISO, dateLabel } from '../utils/helpers'
import { Modal, FormSheet, Confirm, Loader, Empty, SectionHeader } from '../components/UI'

export default function BodyScreen() {
  const { userId, toast } = useApp()
  const [measurements, setMeasurements] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [del,      setDel]      = useState(null)
  const [chartKey, setChartKey] = useState('weight')

  const EMPTY_FORM = { date: todayISO(), weight:'', body_fat:'', waist:'', chest:'', arm:'', thigh:'', notes:'' }
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { load() }, [userId])
  const load = async () => {
    try { setMeasurements(await measurementService.list(userId)) }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.date) return toast('Selecione a data.')
    try {
      if (editing) {
        const u = await measurementService.update(editing.id, form)
        setMeasurements(m => m.map(x => x.id === editing.id ? u : x))
        toast('Medida atualizada!')
      } else {
        const m = await measurementService.create(userId, form)
        setMeasurements(prev => [m, ...prev])
        toast('Medida registrada!')
      }
      setModal(false); setEditing(null); setForm(EMPTY_FORM)
    } catch(e) { toast('Erro: ' + e.message) }
  }

  const openEdit = m => { setEditing(m); setForm({ date:m.date, weight:m.weight||'', body_fat:m.body_fat||'', waist:m.waist||'', chest:m.chest||'', arm:m.arm||'', thigh:m.thigh||'', notes:m.notes||'' }); setModal(true) }
  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }

  const remove = async () => {
    try {
      await measurementService.delete(del.id)
      setMeasurements(m => m.filter(x => x.id !== del.id))
      toast('Medida removida.')
    } finally { setDel(null) }
  }

  const CHART_OPTIONS = [
    { key:'weight',   label:'Peso',    color:'var(--accent)', unit:'kg' },
    { key:'body_fat', label:'% Gord',  color:'var(--orange)', unit:'%' },
    { key:'waist',    label:'Cintura', color:'var(--teal)',   unit:'cm' },
    { key:'arm',      label:'Braço',   color:'var(--purple)', unit:'cm' },
  ]

  const chartData = measurements.slice().reverse().slice(-16).map(m => ({
    date: dateLabel(m.date).slice(0,5),
    weight: parseFloat(m.weight) || null,
    body_fat: parseFloat(m.body_fat) || null,
    waist: parseFloat(m.waist) || null,
    arm: parseFloat(m.arm) || null,
  })).filter(d => Object.values(d).some(v => v !== null && v !== d.date))

  const cur = CHART_OPTIONS.find(o => o.key === chartKey)
  const latestWeight = measurements.find(m => m.weight)
  const lowestWeight = measurements.reduce((min, m) => m.weight && (!min || m.weight < min) ? m.weight : min, null)
  const highestWeight = measurements.reduce((max, m) => m.weight && (!max || m.weight > max) ? m.weight : max, null)

  if (loading) return <div className="screen"><Loader /></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="title-lg">Corpo</h2>
        <button onClick={openNew} style={{ color:'var(--accent)', fontWeight:700, fontSize:24 }}>+</button>
      </div>

      {/* Quick stats */}
      {latestWeight && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, padding:'4px 16px 16px' }}>
          <StatMini label="Atual" value={`${latestWeight.weight}kg`} color="var(--accent)" />
          <StatMini label="Mínimo" value={lowestWeight ? `${lowestWeight}kg` : '—'} color="var(--green)" />
          <StatMini label="Máximo" value={highestWeight ? `${highestWeight}kg` : '—'} color="var(--orange)" />
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div style={{ padding:'0 16px 16px' }}>
          {/* Chart tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
            {CHART_OPTIONS.map(o => (
              <button key={o.key} onClick={() => setChartKey(o.key)}
                style={{ padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0,
                  background: chartKey === o.key ? o.color : 'var(--bg3)',
                  color: chartKey === o.key ? '#fff' : 'var(--t3)',
                  border:`1px solid ${chartKey === o.key ? o.color : 'var(--b1)'}`,
                }}>
                {o.label}
              </button>
            ))}
          </div>

          <div style={{ height:160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
                <XAxis dataKey="date" tick={{ fill:'var(--t3)', fontSize:10 }} />
                <YAxis tick={{ fill:'var(--t3)', fontSize:10 }} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:'var(--t2)' }}
                  formatter={(v) => [`${v}${cur.unit}`, cur.label]}
                />
                <Line type="monotone" dataKey={chartKey} stroke={cur.color} strokeWidth={2} dot={{ r:3, fill:cur.color }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <SectionHeader title="Histórico" action={openNew} actionLabel="+ Registro" />

      {measurements.length === 0
        ? <Empty icon="⚖️" title="Nenhum registro" description="Registre suas medidas para acompanhar a evolução." action={openNew} actionLabel="+ Primeiro Registro" />
        : <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {measurements.map(m => (
              <div key={m.id} style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>{dateLabel(m.date)}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(m)} className="tap-target-44" style={{ color:'var(--t3)', padding:4 }}>✏️</button>
                    <button onClick={() => setDel(m)} className="tap-target-44" style={{ color:'var(--red)', padding:4 }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                  {m.weight    && <Metric label="Peso"    value={`${m.weight}kg`}   color="var(--accent)" />}
                  {m.body_fat  && <Metric label="BF"      value={`${m.body_fat}%`}  color="var(--orange)" />}
                  {m.waist     && <Metric label="Cintura" value={`${m.waist}cm`}    color="var(--teal)" />}
                  {m.chest     && <Metric label="Peito"   value={`${m.chest}cm`}    color="var(--purple)" />}
                  {m.arm       && <Metric label="Braço"   value={`${m.arm}cm`}      color="var(--violet)" />}
                  {m.thigh     && <Metric label="Coxa"    value={`${m.thigh}cm`}    color="var(--cyan)" />}
                </div>
                {m.notes && <p style={{ fontSize:12, color:'var(--t3)', marginTop:8, fontStyle:'italic' }}>"{m.notes}"</p>}
              </div>
            ))}
          </div>
      }

      <div style={{ height:16 }} />

      {modal && (
        <FormSheet title={editing ? 'Editar Registro' : 'Novo Registro'} onClose={() => { setModal(false); setEditing(null) }} onSave={save} saveLabel={editing ? 'Salvar alterações' : 'Criar registro'}>
          <div>
            <label className="label" style={{ display:'block', marginBottom:6 }}>Data</label>
            <input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Peso (kg)"       val={form.weight}   k="weight"   set={setForm} />
            <Field label="% Gordura"        val={form.body_fat} k="body_fat" set={setForm} />
            <Field label="Cintura (cm)"     val={form.waist}    k="waist"    set={setForm} />
            <Field label="Peito (cm)"       val={form.chest}    k="chest"    set={setForm} />
            <Field label="Braço (cm)"       val={form.arm}      k="arm"      set={setForm} />
            <Field label="Coxa (cm)"        val={form.thigh}    k="thigh"    set={setForm} />
          </div>

          <div>
            <label className="label" style={{ display:'block', marginBottom:6 }}>Observações</label>
            <textarea className="inp" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder="Como você está se sentindo..." style={{ resize:'none' }} />
          </div>
        </FormSheet>
      )}

      {del && <Confirm message={`Excluir registro de ${dateLabel(del.date)}?`} onConfirm={remove} onCancel={() => setDel(null)} />}
    </div>
  )
}

function Field({ label, val, k, set }) {
  return (
    <div>
      <label className="label" style={{ display:'block', marginBottom:4, fontSize:10 }}>{label}</label>
      <input type="number" className="inp" value={val} onChange={e => set(f => ({...f, [k]: e.target.value}))} inputMode="decimal" style={{ padding:'10px 12px' }} />
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div>
      <span style={{ fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700, display:'block' }}>{label}</span>
      <span style={{ fontSize:16, fontWeight:700, color }}>{value}</span>
    </div>
  )
}

function StatMini({ label, value, color }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'12px', textAlign:'center' }}>
      <div style={{ fontSize:18, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>{label}</div>
    </div>
  )
}
