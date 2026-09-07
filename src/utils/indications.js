import { daysSince } from './constants'

export function buildIndications(territories, history) {
  const byTerritory = new Map()
  for (const item of history || []) {
    const arr = byTerritory.get(item.territory_id) || []
    arr.push(item)
    byTerritory.set(item.territory_id, arr)
  }

  const rows = (territories || []).filter(t => t.active).map(t => {
    const items = (byTerritory.get(t.id) || []).sort((a,b) => String(b.worked_at).localeCompare(String(a.worked_at)))
    const latest = items[0]
    const days = latest ? daysSince(latest.worked_at) : null
    let score = latest ? Math.min(95, 25 + Math.min(days || 0, 70)) : 100
    if (items.length >= 3 && days !== null && days < 30) score -= 10
    score = Math.max(0, Math.round(score))
    const reason = !latest ? 'Nunca trabalhado' : days === 0 ? 'Trabalhado hoje' : `${days} dias sem ser trabalhado`
    return { territory: t, latest, days, score, reason, timesWorked: items.length }
  })
  return rows.sort((a,b) => b.score - a.score || String(a.territory.name).localeCompare(String(b.territory.name)))
}

export function buildRoadIndications(territories, history) {
  const territoryMap = new Map((territories || []).map(t => [t.id, t]))
  const groups = new Map()
  for (const item of history || []) {
    if (!item.territory_id || !item.road_name?.trim()) continue
    const key = `${item.territory_id}::${item.road_name.trim().toLowerCase()}`
    const current = groups.get(key) || { territoryId:item.territory_id, roadName:item.road_name.trim(), items:[] }
    current.items.push(item)
    groups.set(key,current)
  }
  return [...groups.values()].map(g=>{
    const items=g.items.sort((a,b)=>String(b.worked_at).localeCompare(String(a.worked_at)))
    const latest=items[0]
    const days=daysSince(latest?.worked_at)
    const score=Math.min(100, 35 + Math.min(days || 0,65) + (items.length===1?10:0))
    return { territory:territoryMap.get(g.territoryId), roadName:g.roadName, latest, days, timesWorked:items.length, score:Math.round(score) }
  }).filter(x=>x.territory?.active).sort((a,b)=>b.score-a.score || String(a.roadName).localeCompare(String(b.roadName)))
}
