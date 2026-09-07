import { Map, BookOpen, ArrowRight, LogOut } from 'lucide-react'
import { APP_NAME } from '../utils/constants'

export function ModuleChooser({ onTerritories, onMeeting, onLogout }) {
  return <div className="module-page">
    <div className="module-glow module-glow-a"/>
    <div className="module-glow module-glow-b"/>
    <div className="module-inner">
      <div className="module-brand"><div className="brand-mark">◈</div><span>Oeste de Maracanaú</span></div>
      <div className="module-intro">
        <span className="eyebrow">ÁREA PRINCIPAL</span>
        <h1>O que você deseja acessar?</h1>
        <p>Escolha uma das áreas abaixo para continuar.</p>
      </div>
      <div className="module-grid">
        <button className="module-card" onClick={onTerritories}>
          <div className="module-icon"><Map size={28}/></div>
          <div><b>Territórios</b><span>Mapa, campo, grupos, histórico e indicação inteligente.</span></div>
          <ArrowRight size={20}/>
        </button>
        <button className="module-card meeting" onClick={onMeeting}>
          <div className="module-icon"><BookOpen size={28}/></div>
          <div><b>Reunião meio de semana</b><span>Programação semanal, participantes e imagem pronta para compartilhar.</span></div>
          <ArrowRight size={20}/>
        </button>
      </div>
      <button className="module-logout" onClick={onLogout}><LogOut size={16}/> Sair</button>
    </div>
  </div>
}
