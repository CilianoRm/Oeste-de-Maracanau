const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
]

function cleanName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeRoadName(value) {
  return cleanName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function polygonToOverpass(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return ''
  return polygon
    .map((point) => Array.isArray(point) ? point : [point?.lat, point?.lng])
    .filter(([lat, lng]) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)))
    .map(([lat, lng]) => `${Number(lat).toFixed(6)} ${Number(lng).toFixed(6)}`)
    .join(' ')
}

function buildQuery(polygon) {
  const poly = polygonToOverpass(polygon)
  if (!poly) throw new Error('Este território ainda não possui uma área válida desenhada no mapa.')

  return `[out:json][timeout:35];
(
  way["highway"]["name"](poly:"${poly}");
);
out tags center;`
}

async function fetchEndpoint(endpoint, query, signal) {
  const body = new URLSearchParams({ data: query })
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
    signal,
  })

  if (!response.ok) throw new Error(`Servidor de mapas respondeu ${response.status}.`)
  const json = await response.json()
  return Array.isArray(json?.elements) ? json.elements : []
}

export async function discoverRoadsInsideTerritory(territory) {
  if (!territory) throw new Error('Selecione um território.')
  const query = buildQuery(territory.polygon)
  let lastError = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)
    try {
      const elements = await fetchEndpoint(endpoint, query, controller.signal)
      const names = new globalThis.Map()

      for (const element of elements) {
        const name = cleanName(element?.tags?.name)
        if (!name) continue
        const key = normalizeRoadName(name)
        if (!names.has(key)) {
          names.set(key, {
            osm_id: element.id,
            road_name: name,
            original_name: name,
            highway: element?.tags?.highway || null,
          })
        }
      }

      return [...names.values()].sort((a, b) => a.road_name.localeCompare(b.road_name, 'pt-BR'))
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error('O serviço de mapas demorou demais para responder. Tente novamente em alguns instantes.')
  }
  throw new Error(lastError?.message || 'Não foi possível consultar as ruas no mapa agora.')
}

export function sameRoadName(a, b) {
  return normalizeRoadName(a) === normalizeRoadName(b)
}
