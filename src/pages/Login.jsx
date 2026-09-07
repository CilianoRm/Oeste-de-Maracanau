import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowLeft } from 'lucide-react'
import { APP_NAME, PUBLIC_PASSWORD } from '../utils/constants'

export function Login({ onPublicLogin, onAdminLogin, adminOnly = false, onBack }) {
  const [password,setPassword]=useState('')
  const [show,setShow]=useState(false)
  const [admin,setAdmin]=useState(adminOnly)
  const [email,setEmail]=useState('')
  const [adminPass,setAdminPass]=useState('')
  const [error,setError]=useState('')

  const submit=async e=>{
    e.preventDefault()
    setError('')
    if(admin){
      const r=await onAdminLogin(email.trim(),adminPass)
      if(r?.error)setError(r.error.message||'Não foi possível entrar.')
    }else{
      if(password===PUBLIC_PASSWORD)onPublicLogin()
      else setError('Senha incorreta.')
    }
  }

  const openAdmin=()=>{
    setAdmin(true)
    setError('')
    setPassword('')
  }

  return <div className="login-page">
    <div className="login-glow glow-a"/>
    <div className="login-glow glow-b"/>
    <div className="login-card">
      {adminOnly&&<button type="button" className="back-login" onClick={onBack}><ArrowLeft size={16}/> Voltar</button>}
      <div className="login-logo">◈</div>
      <span className="eyebrow">{admin?'ÁREA RESTRITA':'GERENCIAMENTO DE TERRITÓRIOS'}</span>
      <h1>{admin?'Acesso ao':'Bem-vindo ao'}<br/><em>{APP_NAME}</em></h1>
      <p>{admin?'Entre com o usuário administrativo criado no Supabase.':'Informe a senha para entrar.'}</p>
      <form onSubmit={submit}>
        {admin&&<label>E-mail administrativo<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" placeholder="seuemail@exemplo.com" required/></label>}
        <label>{admin?'Senha administrativa':'Senha'}<div className="password-field"><LockKeyhole size={17}/><input value={admin?adminPass:password} onChange={e=>admin?setAdminPass(e.target.value):setPassword(e.target.value)} type={show?'text':'password'} autoComplete={admin?'current-password':'off'} required/><button type="button" aria-label={show?'Ocultar senha':'Mostrar senha'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {error&&<div className="form-error">{error}</div>}
        <button className="primary-btn" type="submit">{admin?<><ShieldCheck size={17}/> Entrar como administrador</>:<>Entrar</>}</button>
      </form>
      {!adminOnly&&<button className="link-btn" onClick={()=>admin?(setAdmin(false),setError('')):openAdmin()}>{admin?'Voltar ao acesso normal':'Acesso administrativo'}</button>}
      {admin&&adminOnly&&<p className="admin-login-help">O usuário precisa ter <b>role = admin</b> na tabela <b>profiles</b>.</p>}
    </div>
    <div className="login-foot">Organize. Planeje. Pregue.</div>
  </div>
}
