import { useState } from 'react'
import { useApp } from '../hooks/useAppContext'
import { authService } from '../services/auth'
import { profileService } from '../services/profile'
import { WORKOUT_COLORS } from '../utils/helpers'
import { Confirm } from '../components/UI'

export default function SettingsScreen() {
  const { user, profile, refreshProfile, toast, accentColor } = useApp()
  const [form,      setForm]      = useState({
    name:   profile?.name   || '',
    gender: profile?.gender || '',
    weight: profile?.weight || '',
    height: profile?.height || '',
    goal:   profile?.goal   || '',
    accent_color: profile?.accent_color || '#3B82F6',
  })
  const [saving,    setSaving]    = useState(false)
  const [logoutCfm, setLogoutCfm] = useState(false)
  const [pwdMode,   setPwdMode]   = useState(false)
  const [newPwd,    setNewPwd]    = useState('')
  const [pwdDone,   setPwdDone]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await profileService.upsert(user.id, {
        name: form.name,
        gender: form.gender,
        weight: parseFloat(form.weight) || null,
        height: parseFloat(form.height) || null,
        goal: form.goal,
        accent_color: form.accent_color,
      })
      await refreshProfile()
      toast('Perfil salvo!')
    } catch(e) { toast('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const logout = async () => {
    try { await authService.signOut() }
    catch(e) { toast('Erro ao sair: ' + e.message) }
  }

  const changePassword = async () => {
    if (newPwd.length < 6) return toast('Senha mínima: 6 caracteres.')
    try {
      await authService.updatePassword(newPwd)
      setPwdDone(true); setNewPwd('')
      toast('Senha alterada com sucesso!')
    } catch(e) { toast('Erro: ' + e.message) }
  }

  const GOALS = ['Ganhar massa muscular','Perder gordura','Recomposição corporal','Manter peso','Ganhar peso','Definição muscular']
  const ACCENT_COLORS = [...WORKOUT_COLORS, '#10B981', '#EF4444', '#F59E0B', '#A78BFA']

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="title-lg">Configurações</h2>
        <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:13 }} onClick={save} disabled={saving}>
          {saving ? '⏳' : 'Salvar'}
        </button>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Profile */}
        <Section title="Perfil">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{
              width:56, height:56, borderRadius:'50%',
              border:'2px solid var(--accent)',
              background:'var(--bg3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:24,
            }}>💪</div>
            <div>
              <div style={{ fontWeight:700 }}>{profile?.name || user?.email?.split('@')[0]}</div>
              <div style={{ color:'var(--t3)', fontSize:13 }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="Nome" value={form.name} onChange={v => setForm(f => ({...f, name:v}))} placeholder="Seu nome" />

            <div>
              <label className="label" style={{ display:'block', marginBottom:6 }}>Gênero</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['male','Masculino'],['female','Feminino'],['','Prefiro não dizer']].map(([v,l]) => (
                  <button key={v} onClick={() => setForm(f => ({...f, gender:v}))}
                    style={{ flex:1, padding:'8px 6px', borderRadius:'var(--rsm)', fontSize:13, fontWeight:600,
                      background: form.gender===v ? 'var(--accent)' : 'var(--bg3)',
                      border:`1.5px solid ${form.gender===v ? 'var(--accent)' : 'var(--b1)'}`,
                      color: form.gender===v ? '#fff' : 'var(--t2)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Peso (kg)" value={form.weight} onChange={v => setForm(f => ({...f, weight:v}))} type="number" placeholder="80" />
              <Field label="Altura (cm)" value={form.height} onChange={v => setForm(f => ({...f, height:v}))} type="number" placeholder="175" />
            </div>

            <div>
              <label className="label" style={{ display:'block', marginBottom:6 }}>Objetivo</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {GOALS.map(g => (
                  <button key={g} onClick={() => setForm(f => ({...f, goal:g}))}
                    style={{ padding:'10px 14px', borderRadius:'var(--rsm)', textAlign:'left', fontSize:14,
                      background: form.goal===g ? 'var(--accent20)' : 'var(--bg3)',
                      border:`1.5px solid ${form.goal===g ? 'var(--accent)' : 'var(--b1)'}`,
                      color: form.goal===g ? 'var(--accent)' : 'var(--t2)', fontWeight: form.goal===g ? 700 : 400 }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Accent Color */}
        <Section title="Cor do App">
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {ACCENT_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({...f, accent_color:c}))}
                style={{ width:36, height:36, borderRadius:'50%', background:c, border:`3px solid ${form.accent_color===c ? '#fff' : 'transparent'}`, boxShadow: form.accent_color===c ? `0 0 0 2px ${c}` : 'none', transition:'all 0.15s' }} />
            ))}
          </div>
          <p style={{ fontSize:12, color:'var(--t3)', marginTop:8 }}>Salve para aplicar a nova cor.</p>
        </Section>

        {/* Security */}
        <Section title="Segurança">
          {pwdMode ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input className="inp" type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              {pwdDone && <p style={{ color:'var(--green)', fontSize:13 }}>✅ Senha alterada com sucesso!</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost btn-full" onClick={() => { setPwdMode(false); setNewPwd(''); setPwdDone(false) }}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={changePassword}>Alterar</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-full" onClick={() => setPwdMode(true)}>🔑 Alterar Senha</button>
          )}
        </Section>

        {/* About */}
        <Section title="Sobre">
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:14, color:'var(--t2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>App</span><span style={{ color:'var(--t1)', fontWeight:600 }}>Ganhos Brutais</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Versão</span><span style={{ color:'var(--t1)', fontWeight:600 }}>1.0.0</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Backend</span><span style={{ color:'var(--t1)', fontWeight:600 }}>Supabase</span>
            </div>
          </div>
        </Section>

        {/* Logout */}
        <button
          className="btn btn-danger btn-full"
          style={{ marginTop:8, marginBottom:24 }}
          onClick={() => setLogoutCfm(true)}
        >
          🚪 Sair da Conta
        </button>
      </div>

      {logoutCfm && (
        <Confirm
          message="Tem certeza que deseja sair? Seus dados ficam salvos na nuvem."
          onConfirm={logout}
          onCancel={() => setLogoutCfm(false)}
        />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <p className="section-title" style={{ padding:'0 0 12px' }}>{title}</p>
      <div style={{ background:'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div>
      <label className="label" style={{ display:'block', marginBottom:6 }}>{label}</label>
      <input className="inp" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={type==='number' ? 'decimal' : undefined} />
    </div>
  )
}
