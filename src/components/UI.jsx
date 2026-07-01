import { useEffect, useRef, useState } from 'react'
import { useApp } from '../hooks/useAppContext'

// ── Toast ─────────────────────────────────────────────────────
export function Toast() {
  const { toastMsg } = useApp()
  if (!toastMsg) return null
  return <div className="toast">{toastMsg}</div>
}

// ── Form Sheet (standardized create/edit form used across the whole app) ──
// Sticky header + scrollable body + sticky footer with Cancel/Save, so the
// Save button is ALWAYS reachable, even with the keyboard open.
export function FormSheet({ title, onClose, onSave, saving, saveLabel = 'Salvar', saveDisabled, danger, children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal-sheet">
        <div className="modal-handle" style={{ marginTop:12, flexShrink:0 }} />
        <div className="form-sheet-header">
          <span className="title-md">{title}</span>
          <button onClick={onClose} style={{ color:'var(--t3)', fontSize:22, lineHeight:1, minWidth:36, minHeight:36, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div className="form-sheet-body">
          {children}
        </div>
        <div className="form-sheet-footer">
          <button className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
          <button className={`btn btn-full ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? '⏳ Salvando...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
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
        <div style={{ flexShrink:0, padding:'12px 20px 0', display:'flex', justifyContent:'center' }}>
          <div className="modal-handle" style={{ margin:0 }} />
        </div>
        {title && (
          <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 14px' }}>
            <span className="title-md">{title}</span>
            <button onClick={onClose} style={{ color:'var(--t3)', fontSize:22, lineHeight:1, minWidth:36, minHeight:36, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        )}
        <div className="modal-sheet-inner">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Bottom Sheet Picker (e.g. day of week, lists of options) ──
export function SheetPicker({ title, options, selected, onSelect, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          const isSel = value === selected
          return (
            <button key={value} onClick={() => { onSelect(value); onClose() }}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 16px', borderRadius:'var(--r)', fontSize:15, fontWeight:600,
                background: isSel ? 'var(--accent20)' : 'var(--bg3)',
                border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--b1)'}`,
                color: isSel ? 'var(--accent)' : 'var(--t1)',
                minHeight:50, textAlign:'left',
              }}>
              <span>{label}</span>
              {isSel && <span style={{ fontSize:16 }}>✓</span>}
            </button>
          )
        })}
      </div>
    </Modal>
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
let ringIdCounter = 0
export function MacroRing({ value, goal, color, label, unit = '' }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const gradId = useRef(`ring-grad-${ringIdCounter++}`)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <defs>
          <linearGradient id={gradId.current} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.65" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="35" cy="35" r={r} fill="none" stroke="var(--b1)" strokeWidth="6" />
        <circle
          cx="35" cy="35" r={r}
          fill="none"
          stroke={`url(#${gradId.current})`}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
          style={{ transition:'stroke-dasharray 0.6s cubic-bezier(0.32,0.72,0,1)', filter: pct >= 1 ? `drop-shadow(0 0 4px ${color})` : 'none' }}
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
      <div className="prog-bar-fill" style={{ width:`${pct}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 70%, transparent), ${color})` }} />
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
