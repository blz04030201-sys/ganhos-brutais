import { useState } from 'react'
import { AppProvider, useApp } from './hooks/useAppContext'
import AuthScreen      from './pages/AuthScreen'
import DashboardScreen from './pages/DashboardScreen'
import WorkoutsScreen  from './pages/WorkoutsScreen'
import DietScreen      from './pages/DietScreen'
import SettingsScreen  from './pages/SettingsScreen'
import BottomNav       from './components/BottomNav'
import { Toast, Loader } from './components/UI'
import './styles/global.css'

function AppInner() {
  const { user, loading } = useApp()
  const [tab, setTab] = useState('dashboard')

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>💪</div>
      <div className="loader" />
    </div>
  )

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
