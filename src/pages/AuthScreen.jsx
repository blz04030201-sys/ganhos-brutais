import { useState } from 'react'
import { authService } from '../services/auth'
import { emailOk } from '../utils/helpers'
import { useApp } from '../hooks/useAppContext'

export default function AuthScreen() {
  const { toast } = useApp()
  const [mode, setMode] = useState('login') // login | register | reset
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const clear = () => { setError(''); setDone(false) }

  const submit = async () => {
    clear()
    if (!emailOk(email)) return setError('E-mail inválido.')
    if (mode !== 'reset' && password.length < 6) return setError('Senha mínima 6 caracteres.')
    if (mode === 'register' && password !== confirm) return setError('Senhas não conferem.')

    setLoading(true)
    try {
      if (mode === 'login') {
        await authService.signIn(email.trim(), password)
      } else if (mode === 'register') {
        await authService.signUp(email.trim(), password, name.trim())
        setDone(true)
        toast('Conta criada! Verifique seu e-mail.')
        return
      } else {
        await authService.resetPassword(email.trim())
        setDone(true)
        toast('E-mail de recuperação enviado!')
        return
      }
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('Invalid login'))   setError('E-mail ou senha incorretos.')
      else if (msg.includes('already'))    setError('E-mail já cadastrado. Faça login.')
      else if (msg.includes('Email not'))  setError('Confirme seu e-mail antes de entrar.')
      else setError(msg || 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      background: 'var(--bg)',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{
          width:80, height:80,
          borderRadius:'50%',
          border:'3px solid var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36, margin:'0 auto 16px',
          boxShadow:'0 0 32px var(--accent20)',
          background:'var(--bg2)',
        }}>💪</div>
        <h1 className="title-xl" style={{ fontSize:42, letterSpacing:3 }}>GANHOS</h1>
        <h1 className="title-xl" style={{ fontSize:42, letterSpacing:3, color:'var(--accent)' }}>BRUTAIS</h1>
        <p style={{ color:'var(--t3)', fontSize:13, marginTop:6, letterSpacing:2, textTransform:'uppercase' }}>
          Treino · Dieta · Evolução
        </p>
      </div>

      {/* Form */}
      <div style={{ width:'100%', maxWidth:360 }}>
        {/* Mode tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {[['login','Entrar'],['register','Cadastrar']].map(([m,l]) => (
            <button
              key={m}
              onClick={() => { setMode(m); clear() }}
              style={{
                flex:1, padding:'10px', borderRadius:'var(--rsm)',
                background: mode === m ? 'var(--accent)' : 'var(--bg3)',
                border:`1.5px solid ${mode === m ? 'var(--accent)' : 'var(--b1)'}`,
                color: mode === m ? '#fff' : 'var(--t2)',
                fontWeight:600, fontSize:14, transition:'all 0.15s',
              }}
            >{l}</button>
          ))}
        </div>

        {done ? (
          <div className="card" style={{ textAlign:'center', padding:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {mode === 'register' ? '✉️' : '📬'}
            </div>
            <h3 style={{ marginBottom:8 }}>
              {mode === 'register' ? 'Confirme seu e-mail' : 'E-mail enviado!'}
            </h3>
            <p style={{ color:'var(--t2)', fontSize:14, lineHeight:1.6 }}>
              {mode === 'register'
                ? 'Acesse seu e-mail e clique no link de confirmação para ativar sua conta.'
                : 'Verifique sua caixa de entrada e siga as instruções para redefinir a senha.'}
            </p>
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop:16 }}
              onClick={() => { setMode('login'); setDone(false) }}
            >Voltar para login</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {mode === 'register' && (
                <input className="inp" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              )}

              {mode !== 'reset' ? (
                <>
                  <input className="inp" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
                  <input className="inp" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && submit()} />
                  {mode === 'register' && (
                    <input className="inp" type="password" placeholder="Confirmar senha" value={confirm} onChange={e => setConfirm(e.target.value)} />
                  )}
                </>
              ) : (
                <input className="inp" type="email" placeholder="E-mail cadastrado" value={email} onChange={e => setEmail(e.target.value)} inputMode="email" />
              )}
            </div>

            {error && (
              <div style={{
                marginTop:12, padding:'10px 14px',
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:'var(--rsm)', color:'var(--red)', fontSize:13,
              }}>{error}</div>
            )}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop:16, fontSize:16 }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? <span className="spin" style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%' }} /> : (
                mode === 'login' ? 'Entrar' :
                mode === 'register' ? 'Criar conta' : 'Enviar e-mail'
              )}
            </button>

            {mode === 'login' && (
              <button
                onClick={() => { setMode('reset'); clear() }}
                style={{ width:'100%', marginTop:12, color:'var(--t3)', fontSize:13, textAlign:'center', background:'none', border:'none', padding:'8px' }}
              >Esqueci minha senha</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
