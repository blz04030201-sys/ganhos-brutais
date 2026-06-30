import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './hooks/useAppContext'
import AuthScreen      from './pages/AuthScreen'
import DashboardScreen from './pages/DashboardScreen'
import WorkoutsScreen  from './pages/WorkoutsScreen'
import DietScreen      from './pages/DietScreen'
import SettingsScreen  from './pages/SettingsScreen'
import BottomNav       from './components/BottomNav'
import { Toast, Loader } from './components/UI'
import './styles/global.css'

/* ── Visual Viewport / keyboard handler ────────────────────── */
function useKeyboardSafeArea() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, offset)}px`)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [])
}

/* ── Splash ─────────────────────────────────────────────────── */
function Splash() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'var(--bg)', animation: 'fadeIn 0.3s ease',
    }}>
      <img
        src="/ganhos-brutais/icons/icon-192.png"
        alt="Ganhos Brutais"
        style={{ width: 96, height: 96, borderRadius: 22, boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.12em', color: 'var(--accent)' }}>GANHOS BRUTAIS</div>
        <div style={{ color: 'var(--t3)', fontSize: 12, marginTop: 4 }}>Treino · Dieta · Evolução</div>
      </div>
      <div className="loader" style={{ marginTop: 8 }} />
    </div>
  )
}

function AppInner() {
  const { user, loading } = useApp()
  const [tab, setTab] = useState('dashboard')
  useKeyboardSafeArea()

  if (loading) return <Splash />
  if (!user) return <AuthScreen />

  const Screen = {
    dashboard: DashboardScreen,
    workouts:  WorkoutsScreen,
    diet:      DietScreen,
    settings:  SettingsScreen,
  }[tab] || DashboardScreen

  return (
    <>
      <Screen setTab={setTab} />
      <BottomNav tab={tab} setTab={setTab} />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
