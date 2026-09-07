import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed, Check, RotateCcw, Trash2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const center = [-3.87, -38.62]
const icon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
function DrawClicks({ active, onAdd }) { useMapEvents({ click(e){ if(active) onAdd([e.latlng.lat,e.latlng.lng]) } }); return null }
function FlyTo({ point }) { const map=useMap(); useEffect(()=>{ if(point) map.flyTo(point,16,{duration:.7}) },[point,map]); return null }

export function MapView({ territories=[], history=[], selectable=false, onPolygon, onClearPolygon, selectedTerritoryId, focus }) {
  const [drawing,setDrawing]=useState(false), [points,setPoints]=useState([]), [mapFocus,setMapFocus]=useState(null)
  const mapped = useMemo(()=>territories.filter(t=>Array.isArray(t.polygon)&&t.polygon.length>2),[territories])
  const latest = history?.slice(0,50).filter(x=>x.latitude!=null&&x.longitude!=null) || []
  const selected=territories.find(t=>t.id===selectedTerritoryId)
  const finish=()=>{ if(points.length>2) onPolygon?.(points); setPoints([]); setDrawing(false) }
  return <div className="map-wrap">
    <MapContainer center={center} zoom={13} scrollWheelZoom className="map">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <DrawClicks active={drawing} onAdd={p=>setPoints(v=>[...v,p])}/><FlyTo point={focus||mapFocus}/>
      {mapped.map(t=><Polygon key={t.id} positions={t.polygon} pathOptions={{color:t.color||'#6D45A6',fillOpacity:t.id===selectedTerritoryId ? .15 : .12,weight:t.id===selectedTerritoryId?3:2}}><Popup><b>{t.name}</b>{t.nickname&&<><br/>Apelido: {t.nickname}</>}</Popup></Polygon>)}
      {points.length>1&&<Polygon positions={points} pathOptions={{color:'#6D45A6',dashArray:'6',fillOpacity:.08}}/>}
      {latest.map(x=><Marker key={x.id} position={[Number(x.latitude),Number(x.longitude)]} icon={icon}><Popup><b>Último ponto trabalhado</b><br/>{x.road_name||'Rua não informada'}{x.house_number?`, ${x.house_number}`:''}<br/>{x.note||''}</Popup></Marker>)}
    </MapContainer>
    {selectable&&<div className="map-tools"><button className={`tool-btn ${drawing?'active':''}`} onClick={()=>{setDrawing(!drawing);setPoints([])}}>{drawing?'Cancelar desenho':'Desenhar território'}</button>{drawing&&<><button className="tool-btn" disabled={points.length<3} onClick={finish}><Check size={16}/> Salvar área ({points.length})</button><button className="tool-btn" onClick={()=>setPoints([])}><RotateCcw size={16}/></button></>}{selected?.polygon&&<button className="tool-btn danger" onClick={()=>{if(confirm('Remover a área deste território?'))onClearPolygon?.(selected.id)}}><Trash2 size={16}/> Limpar área</button>}</div>}
    <button className="locate-btn" onClick={()=>setMapFocus(center)}><LocateFixed size={18}/></button>
  </div>
}
