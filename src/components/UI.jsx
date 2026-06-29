import { useEffect } from 'react'
import { useApp } from '../hooks/useAppContext'

// ── Toast ─────────────────────────────────────────────────────
export function Toast() {
  const { toastMsg } = useApp()
  if (!toastMsg) return null
  return <div className="toast">{toastMsg}</div>
}

// ── Modal Sheet ───────────────────────────────────────────────
export function Modal({ onClose, children, title }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <span className="title-md">{title}</span>
            <button onClick={onClose} style={{ color:'var(--t3)', fontSize:22, lineHeight:1 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────
export function Confirm({ message, onConfirm, onCancel, danger = true }) {
  return (
    <Modal onClose={onCancel}>
      <p style={{ color:'var(--t2)', marginBottom:20, lineHeight:1.6 }}>{message}</p>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-ghost btn-full" onClick={onCancel}>Cancelar</button>
        <button className={`btn btn-full ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirmar</button>
      </div>
    </Modal>
  )
}

// ── Loader ────────────────────────────────────────────────────
export function Loader() {
  return (
    <div className="loader-wrap">
      <div className="loader" />
    </div>
  )
}

// ── Macro Ring ────────────────────────────────────────────────
export function MacroRing({ value, goal, color, label, unit = '' }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="var(--b1)" strokeWidth="5" />
        <circle
          cx="35" cy="35" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
          style={{ transition:'stroke-dasharray 0.4s ease' }}
        />
        <text x="35" y="38" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
          {Math.round(value)}{unit}
        </text>
      </svg>
      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--t3)' }}>{label}</span>
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value, goal, color }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="prog-bar">
      <div className="prog-bar-fill" style={{ width:`${pct}%`, background: color }} />
    </div>
  )
}

// ── Icon Picker ───────────────────────────────────────────────
export function IconPicker({ icons, selected, onSelect }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {icons.map(ic => (
        <button
          key={ic}
          onClick={() => onSelect(ic)}
          style={{
            fontSize:22, padding:'8px', borderRadius:'var(--rsm)',
            background: selected === ic ? 'var(--accent20)' : 'var(--bg3)',
            border: `1.5px solid ${selected === ic ? 'var(--accent)' : 'var(--b1)'}`,
            transition:'all 0.15s',
          }}
        >{ic}</button>
      ))}
    </div>
  )
}

// ── Color Picker ──────────────────────────────────────────────
export function ColorPicker({ colors, selected, onSelect }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {colors.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          style={{
            width:32, height:32, borderRadius:'50%', background:c,
            border:`3px solid ${selected === c ? 'white' : 'transparent'}`,
            boxShadow: selected === c ? `0 0 0 2px ${c}` : 'none',
            transition:'all 0.15s',
          }}
        />
      ))}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export function Empty({ icon = '📭', title, description, action, actionLabel }) {
  return (
    <div className="empty-state fi">
      <div className="icon">{icon}</div>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action && (
        <button className="btn btn-primary" style={{ marginTop:20 }} onClick={action}>
          {actionLabel || 'Começar'}
        </button>
      )}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 6px' }}>
      <span className="section-title" style={{ padding:0 }}>{title}</span>
      {action && (
        <button onClick={action} style={{
          fontSize:13, fontWeight:600, color:'var(--accent)',
          background:'none', border:'none', padding:'2px 0',
        }}>{actionLabel || '+ Adicionar'}</button>
      )}
    </div>
  )
}

// ── Set Input Row ─────────────────────────────────────────────
export function SetRow({ num, weight, reps, isPR, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <span style={{
        width:28, height:28, borderRadius:'50%',
        background:'var(--b1)', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, fontWeight:700, color:'var(--t3)', flexShrink:0,
      }}>{num}</span>

      <div style={{ position:'relative', flex:1 }}>
        <input
          className="inp"
          type="number"
          placeholder="kg"
          value={weight}
          onChange={e => onChange({ weight: e.target.value, reps })}
          style={{ paddingRight:36 }}
          inputMode="decimal"
        />
        <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--t3)' }}>kg</span>
      </div>

      <div style={{ position:'relative', flex:1 }}>
        <input
          className="inp"
          type="text"
          placeholder="reps"
          value={reps}
          onChange={e => onChange({ weight, reps: e.target.value })}
          inputMode="numeric"
        />
      </div>

      {isPR && <span className="pr-badge">🏆 PR</span>}
    </div>
  )
}
