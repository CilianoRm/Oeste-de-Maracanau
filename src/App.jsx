import { useEffect, useState } from 'react'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { MapPage } from './pages/MapPage'
import { Field } from './pages/Field'
import { Groups } from './pages/Groups'
import { History } from './pages/History'
import { Indications } from './pages/Indications'
import { Admin } from './pages/Admin'
import { Meeting } from './pages/Meeting'
import { ModuleChooser } from './pages/ModuleChooser'
import { AppShell } from './layouts/AppShell'
import { Toast } from './components/Toast'
import { supabase, supabaseConfigured } from './lib/supabase'
import { useData } from './hooks/useData'
import { useAuth } from './hooks/useAuth'
import { updateRow } from './services/data'

export default function App(){
 const [publicAccess,setPublicAccess]=useState(localStorage.getItem('oeste_access')==='1')
 const [module,setModule]=useState(localStorage.getItem('oeste_module') || 'chooser')
 const [page,setPage]=useState('home'),[admin,setAdmin]=useState(false),[showAdminLogin,setShowAdminLogin]=useState(false),[adminTarget,setAdminTarget]=useState('territories'),[selectedTerritory,setSelectedTerritory]=useState(null),[toast,setToast]=useState(null),[adminJustSignedIn,setAdminJustSignedIn]=useState(false)
 const data=useData();const auth=useAuth()

 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),3500);return()=>clearTimeout(t)}},[toast])

 useEffect(()=>{
   if(auth.isAdmin){
     setPublicAccess(true)
     setShowAdminLogin(false)
     if(adminJustSignedIn){
       if(adminTarget==='meeting'){
         setModule('meeting')
         localStorage.setItem('oeste_module','meeting')
         setAdmin(false)
       } else {
         setAdmin(true)
       }
     }
   }
 },[auth.isAdmin,adminJustSignedIn,adminTarget])

 const logout=async()=>{
   if(supabase)await auth.signOut()
   localStorage.removeItem('oeste_access')
   localStorage.removeItem('oeste_module')
   setPublicAccess(false);setAdmin(false);setAdminJustSignedIn(false);setShowAdminLogin(false);setModule('chooser');setPage('home')
 }

 const publicLogin=()=>{
   localStorage.setItem('oeste_access','1')
   localStorage.setItem('oeste_module','chooser')
   setPublicAccess(true)
   setModule('chooser')
 }

 const openTerritories=()=>{
   localStorage.setItem('oeste_module','territories')
   setModule('territories')
   setPage('home')
 }

 const openMeeting=()=>{
   setAdminTarget('meeting')
   if(auth.isAdmin){
     localStorage.setItem('oeste_module','meeting')
     setModule('meeting')
   } else setShowAdminLogin(true)
 }

 const adminLogin=async(...args)=>{
   const r=await auth.signIn(...args)
   if(!r?.error)setAdminJustSignedIn(true)
   return r
 }

 if(!publicAccess) return <><Login onPublicLogin={publicLogin} onAdminLogin={adminLogin}/></>

 if(showAdminLogin&&!auth.isAdmin) return <><Login adminOnly onBack={()=>setShowAdminLogin(false)} onPublicLogin={publicLogin} onAdminLogin={adminLogin}/></>

 if(data.loading && !data.territories.length) return <div className="loading-screen"><div className="spinner"/><b>Carregando territórios…</b>{!supabaseConfigured&&<span>Configure o arquivo .env para conectar ao Supabase.</span>}</div>

 if(admin&&auth.isAdmin) return <><Admin data={data} reload={data.reload} setToast={setToast} onBack={()=>setAdmin(false)} onOpenMap={(id)=>{setSelectedTerritory(id);setAdmin(false);setPage('map')}}/><Toast toast={toast}/></>

 if(module==='chooser') return <><ModuleChooser onTerritories={openTerritories} onMeeting={openMeeting} onLogout={logout}/><Toast toast={toast}/></>

 if(module==='meeting') return <><Meeting data={data} isAdmin={auth.isAdmin} onAdmin={()=>{setAdminTarget('meeting');setAdmin(true)}} onBack={()=>{localStorage.setItem('oeste_module','chooser');setModule('chooser')}}/><Toast toast={toast}/></>

 const savePolygon=async(id,polygon)=>{
   try{await updateRow('territories',id,{polygon});setToast({message:'Área do território atualizada.'});data.reload()}
   catch(e){setToast({type:'error',message:e.message})}
 }

 let content=page==='home'?<Home data={data} setPage={setPage}/>:page==='map'?<MapPage data={data} selectedTerritory={selectedTerritory} setSelectedTerritory={setSelectedTerritory} isAdmin={auth.isAdmin} onSavePolygon={savePolygon} onClearPolygon={async id=>{try{await updateRow('territories',id,{polygon:null});setToast({message:'Área removida do território.'});data.reload()}catch(e){setToast({type:'error',message:e.message})}}}/>:page==='field'?<Field data={data} isAdmin={auth.isAdmin} setToast={setToast} reload={data.reload}/>:page==='groups'?<Groups data={data}/>:page==='indications'?<Indications data={data} setPage={setPage} setSelectedTerritory={setSelectedTerritory}/>:<History data={data} />

 return <><AppShell page={page} setPage={setPage} isAdmin={auth.isAdmin} onAdmin={()=>{setAdminTarget('territories');setAdmin(true)}} onAdminLogin={()=>{setAdminTarget('territories');setShowAdminLogin(true)}} onLogout={logout}>{content}</AppShell>{data.error&&<div className="error-banner">{data.error}</div>}<Toast toast={toast}/></>
}
