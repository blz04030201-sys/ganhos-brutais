import { Component } from 'react'

/**
 * Rede de segurança: se algum erro acontecer durante a renderização (em
 * qualquer tela), o React por padrão desmonta o app inteiro e a tela fica
 * em branco, sem nenhuma mensagem. Este componente captura esse erro e
 * mostra uma tela explicando o problema, com um botão para tentar de novo —
 * em vez de uma tela branca sem nenhuma pista do que aconteceu.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: 'var(--bg, #050510)', color: '#fff', padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Algo deu errado</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 320, lineHeight: 1.5 }}>
            {this.state.error?.message || 'Erro inesperado ao carregar o app.'}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{
              marginTop: 8, padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
