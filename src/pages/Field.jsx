import { useMemo, useState } from 'react'
import { CheckCircle2, Plus, Download, Search, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Modal } from '../components/Modal'
import { formatDate, formatTime, scheduleTime, weekdayIndex, dayNames, weekStartISO, addWeeksISO, weekRangeLabel, schedulesForWeek } from '../utils/constants'
import { insertRow } from '../services/data'
import { generateSchedulePNG } from '../utils/png'

export function Field({data,isAdmin,setToast,reload}){
 const [showStop,setShowStop]=useState(false),[search,setSearch]=useState(''),[selectedWeek,setSelectedWeek]=useState(()=>weekStartISO())
 const leaders=new Map(data.members.map(x=>[x.id,x.name||x.full_name||'Sem nome'])),locs=new Map(data.locations.map(x=>[x.id,x.name])),terrs=new Map(data.territories.map(x=>[x.id,x.name]))
 const rows=useMemo(()=>{
   const weekly=schedulesForWeek(data.schedules||[],selectedWeek)
   return weekly.filter(s=>s.status!=='cancelled' && (`${s._displayDate||''} ${s.weekday_name||''} ${locs.get(s.location_id)||''} ${terrs.get(s.territory_id)||''}`).toLowerCase().includes(search.toLowerCase()))
 },[data.schedules,search,selectedWeek])
 const submitStop=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await insertRow('territory_work_history',{territory_id:f.get('territory_id'),group_id:f.get('group_id')||null,leader_id:f.get('leader_id')||null,worked_at:f.get('worked_at'),road_name:f.get('road_name')||null,house_number:f.get('house_number')||null,complement:f.get('complement')||null,note:f.get('note')||null});setShowStop(false);setToast({message:'Parada registrada com sucesso.'});reload()}catch(err){setToast({type:'error',message:err.message})}}
 const chooseDate=(value)=>setSelectedWeek(weekStartISO(value||new Date()))
 return <div className="page">
   <div className="page-top"><div><span className="eyebrow">ORGANIZAÇÃO</span><h1>Serviço de campo</h1><p>Programação semanal, de segunda-feira a domingo.</p></div><div className="head-actions"><button className="secondary-btn" onClick={()=>generateSchedulePNG(rows,locs,leaders,terrs)}><Download size={16}/> Gerar PNG</button><button className="primary-small" onClick={()=>setShowStop(true)}><Plus size={16}/> Registrar parada</button></div></div>
   <div className="field-week-picker">
     <button className="secondary-btn icon-only" type="button" onClick={()=>setSelectedWeek(addWeeksISO(selectedWeek,-1))} aria-label="Semana anterior"><ChevronLeft size={16}/></button>
     <label>Escolher semana<input type="date" value={selectedWeek} onChange={e=>chooseDate(e.target.value)}/></label>
     <button className="secondary-btn icon-only" type="button" onClick={()=>setSelectedWeek(addWeeksISO(selectedWeek,1))} aria-label="Próxima semana"><ChevronRight size={16}/></button>
     <button className="secondary-btn" type="button" onClick={()=>setSelectedWeek(weekStartISO())}>Semana atual</button>
     <div className="field-week-range"><CalendarDays size={16}/><b>{weekRangeLabel(selectedWeek)}</b><span>segunda a domingo</span></div>
   </div>
   <div className="toolbar"><div className="search-field"><Search size={17}/><input placeholder="Pesquisar território, local ou dia..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
   <div className="schedule-table"><div className="table-head"><span>Dia / data</span><span>Horário</span><span>Local</span><span>Dirigente</span><span>Território</span><span>Status</span></div>{rows.map((s,index)=>{const d=s._displayDate||s.service_date;const wi=weekdayIndex(s);return <div className="table-row" key={`${s.id||s._sourceId||'virtual'}-${d}-${index}`}><span>{d?formatDate(d):(wi!==null?dayNames[wi]:'—')}</span><b>{formatTime(scheduleTime(s))}</b><span>{locs.get(s.location_id)||'—'}</span><span>{leaders.get(s.leader_id)||'Não definido'}</span><span>{terrs.get(s.territory_id)||'Não definido'}</span><span className="status-ok"><CheckCircle2 size={14}/> Programado</span></div>})}{!rows.length&&<div className="empty">Nenhuma programação cadastrada para esta semana.</div>}</div>
   {showStop&&<Modal title="Registrar onde paramos" onClose={()=>setShowStop(false)}><form className="form-grid" onSubmit={submitStop}><label>Data<input type="date" name="worked_at" defaultValue={new Date().toISOString().slice(0,10)} required/></label><label>Território<select name="territory_id" required><option value="">Selecione</option>{data.territories.filter(x=>x.active).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Grupo<select name="group_id"><option value="">Não informado</option>{data.groups.filter(x=>x.active).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Dirigente<select name="leader_id"><option value="">Não informado</option>{data.members.filter(x=>x.active&&x.member_type==='field_leader').map(m=><option key={m.id} value={m.id}>{m.name||m.full_name||'Sem nome'}</option>)}</select></label><label>Rua<input name="road_name" placeholder="Rua José Alves"/></label><label>Número<input name="house_number" placeholder="245"/></label><label className="full">Complemento<input name="complement" placeholder="Lado esquerdo, após a esquina..."/></label><label className="full">Observação / referência<textarea name="note" placeholder="Faltaram as casas do outro lado da rua."/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowStop(false)}>Cancelar</button><button className="primary-btn" type="submit">Salvar registro</button></div></form></Modal>}
 </div>
}
