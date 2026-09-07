import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'oeste_meeting_weeks_v1'
const IMPORT_URL = import.meta.env.VITE_MEETING_IMPORT_URL || ''

export const meetingRoleKeys = [
  'opening_prayer',
  'president',
  'part_1',
  'part_2',
  'part_3',
  'part_4',
  'part_5',
  'part_6',
  'part_7',
  'part_8_conductor',
  'part_8_reader',
  'closing_prayer',
  'cleaning_group',
  'entrance_indicators',
  'audio_video',
  'stage',
  'auditorium_indicator',
  'attendants',
]

export const defaultAssignments = () => Object.fromEntries(meetingRoleKeys.map((key) => [key, []]))

function localRead() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function localWrite(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function getPreviousWeekStart(weekStart) {
  const d = new Date(`${weekStart}T12:00:00`)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export function getWeekEnd(weekStart) {
  const d = new Date(`${weekStart}T12:00:00`)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export function shiftWeekStart(weekStart, weeks = 0) {
  const d = new Date(`${weekStart}T12:00:00`)
  d.setDate(d.getDate() + (Number(weeks) || 0) * 7)
  return getWeekStart(d)
}

export function getMeetingWednesday(weekStart) {
  const d = new Date(`${weekStart}T12:00:00`)
  d.setDate(d.getDate() + 2)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), iso: d.toISOString().slice(0, 10) }
}

export function meetingSourceUrl(weekStart) {
  const d = getMeetingWednesday(weekStart)
  return `https://wol.jw.org/pt/wol/dt/r5/lp-t/${d.year}/${d.month}/${d.day}`
}

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractHeadings(html) {
  const out = []
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m
  while ((m = re.exec(html))) out.push(cleanText(m[2]))
  return out
}

function extractBodyText(html) {
  return cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '))
}

function parseMeetingHtml(html, weekStart) {
  const headings = extractHeadings(html)
  const text = extractBodyText(html)
  const weekMatch = text.match(/(\d{1,2})\s+DE\s+([A-ZÇÃÕÉÊÁÍÓÚÜ-]+)\s*[–-]\s*(\d{1,2})\s+DE\s+([A-ZÇÃÕÉÊÁÍÓÚÜ-]+)/i)
  const bibleMatch = headings.find((h) => /^[A-ZÇÃÕÉÊÁÍÓÚÜ\s-]+\d+/.test(h) && !/REUNIÃO|APOSTILA/i.test(h))
  const parts = []
  const normalized = headings.map((h) => h.replace(/\s+/g, ' ').trim())
  normalized.forEach((h) => {
    const m = h.match(/^([1-8])\.\s*(.+)$/)
    if (m) parts.push({ number: Number(m[1]), title: m[2].replace(/[“”]/g, '"').trim() })
  })

  const durations = {}
  const durationRe = /(?:^|\s)(\d{1,2})\.\s*[^()]{1,160}\((\d+)\s*min\.?\)/gi
  let dm
  while ((dm = durationRe.exec(text))) durations[Number(dm[1])] = Number(dm[2])
  parts.forEach((p) => { p.duration = durations[p.number] || null })

  // Os cânticos aparecem em sequência na página: abertura, meio e encerramento.
  const songNumbers = [...text.matchAll(/Cântico\s+(\d+)/gi)].map((m) => Number(m[1]))
  const songs = {
    opening: songNumbers[0] || '',
    opening_title: '',
    mid: songNumbers[1] || '',
    mid_title: '',
    closing: songNumbers.length ? songNumbers[songNumbers.length - 1] : '',
    closing_title: '',
  }

  // Tenta guardar a instrução curta das partes do ministério sem trazer todo o artigo.
  for (const part of parts) {
    if (part.number < 4 || part.number > 6) continue
    const next = part.number + 1
    const re = new RegExp(String.raw`(?:^|\s)${part.number}\.\s*[^()]{1,180}\(\d+\s*min\.?\)\s*([\s\S]{0,220}?)(?=\s${next}\.\s|\sNOSSA VIDA CRISTÃ|$)`, 'i')
    const m = text.match(re)
    if (m?.[1]) {
      const short = cleanText(m[1]).replace(/\s*\([^)]*\)\s*$/, '').trim()
      if (short && short.length <= 210) part.subtitle = short
    }
  }

  const sourceTitle = normalized.find((h) => /APOSTILA DA REUNIÃO VIDA E MINISTÉRIO|\d{1,2}[–-]\d{1,2} DE|REUNIÃO VIDA E MINISTÉRIO/i.test(h)) || ''
  return {
    week_start: weekStart,
    week_end: getWeekEnd(weekStart),
    source_url: meetingSourceUrl(weekStart),
    source_title: sourceTitle || `Reunião Vida e Ministério — ${weekStart}`,
    bible_text: bibleMatch || '',
    parts,
    songs,
    raw_excerpt: text.slice(0, 12000),
    imported_at: new Date().toISOString(),
    assignments: defaultAssignments(),
    settings: {
      meeting_time: '19:30',
      meeting_weekday: 'Quarta-feira',
      cleaning_group: '',
      entrance_indicators: '',
      audio_video: '',
      stage: '',
      auditorium_indicator: '',
      attendants: '',
    },
    parsed_week_label: weekMatch ? `${weekMatch[1]} ${weekMatch[2]}–${weekMatch[3]} ${weekMatch[4]}` : '',
  }
}

export async function importMeetingFromUrl(url, weekStart = getWeekStart()) {
  const response = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml' } })
  if (!response.ok) throw new Error(`A fonte da reunião respondeu ${response.status}.`)
  const html = await response.text()
  return parseMeetingHtml(html, weekStart)
}

async function importThroughLocalDevProxy(weekStart) {
  const response = await fetch(`/__meeting-source?week_start=${encodeURIComponent(weekStart)}`, {
    headers: { Accept: 'text/html' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Proxy local respondeu ${response.status}.`)
  const html = await response.text()
  const parsed = parseMeetingHtml(html, weekStart)
  if (!parsed?.parts?.length) throw new Error('A fonte oficial abriu, mas as partes não puderam ser identificadas.')
  return parsed
}

async function importThroughEdgeFunction(weekStart) {
  if (!IMPORT_URL) throw new Error('Edge Function não configurada.')
  const response = await fetch(`${IMPORT_URL}?week_start=${encodeURIComponent(weekStart)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Importador online respondeu ${response.status}.`)
  const payload = await response.json()
  if (!payload?.week_start || !Array.isArray(payload?.parts) || !payload.parts.length) {
    throw new Error('O importador online retornou uma resposta incompleta.')
  }
  return payload
}

async function importThroughPublishedSnapshot(weekStart) {
  const base = import.meta.env.BASE_URL || '/'
  const response = await fetch(`${base}meeting-current.json?t=${Date.now()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Programação publicada respondeu ${response.status}.`)
  const payload = await response.json()
  if (payload?.week_start !== weekStart || !Array.isArray(payload?.parts) || !payload.parts.length) {
    throw new Error('A programação publicada ainda não corresponde à semana atual.')
  }
  return payload
}

export async function importCurrentMeeting(weekStart = getWeekStart()) {
  // No VS Code/Vite, usamos um proxy do próprio servidor de desenvolvimento.
  // Assim o navegador não acessa wol.jw.org diretamente e o CORS não bloqueia.
  if (import.meta.env.DEV) {
    try {
      return await importThroughLocalDevProxy(weekStart)
    } catch (devError) {
      console.warn('Importação local da reunião falhou:', devError?.message || devError)
      if (IMPORT_URL) {
        try { return await importThroughEdgeFunction(weekStart) } catch (edgeError) {
          console.warn('Edge Function da reunião falhou:', edgeError?.message || edgeError)
        }
      }
      throw new Error('Não foi possível atualizar pela fonte oficial agora. Mantendo a programação de segurança.')
    }
  }

  // No GitHub Pages, o workflow semanal publica um snapshot oficial junto com o site.
  // Isso evita CORS e também evita depender da Edge Function para o uso normal.
  try {
    return await importThroughPublishedSnapshot(weekStart)
  } catch (snapshotError) {
    if (IMPORT_URL) {
      try { return await importThroughEdgeFunction(weekStart) } catch (edgeError) {
        throw new Error(`${snapshotError?.message || 'Snapshot indisponível'} ${edgeError?.message || 'Importador online indisponível'}`)
      }
    }
    throw new Error(`${snapshotError?.message || 'Programação publicada indisponível'} Mantendo a programação de segurança.`)
  }
}

function mergeAssignments(previous, fresh) {
  const merged = { ...defaultAssignments(), ...(previous?.assignments || {}) }
  for (const key of meetingRoleKeys) {
    if (fresh.assignments?.[key]?.length) merged[key] = fresh.assignments[key]
  }
  return merged
}

export async function loadMeetingWeek(weekStart = getWeekStart()) {
  if (supabase) {
    const { data, error } = await supabase.from('meeting_weeks').select('*').eq('week_start', weekStart).maybeSingle()
    if (!error && data) return data
  }
  return localRead().find((x) => x.week_start === weekStart) || null
}

export async function saveMeetingWeek(row) {
  const fullPayload = {
    ...row,
    updated_at: new Date().toISOString(),
  }

  // Envia ao Supabase somente as colunas existentes na tabela meeting_weeks.
  // Campos auxiliares, como import_error e parsed_week_label, ficam no armazenamento local.
  const dbPayload = {
    week_start: fullPayload.week_start,
    week_end: fullPayload.week_end,
    source_url: fullPayload.source_url || null,
    source_title: fullPayload.source_title || null,
    bible_text: fullPayload.bible_text || null,
    parts: Array.isArray(fullPayload.parts) ? fullPayload.parts : [],
    songs: fullPayload.songs || {},
    assignments: fullPayload.assignments || {},
    settings: fullPayload.settings || {},
    imported_at: fullPayload.imported_at || new Date().toISOString(),
    updated_at: fullPayload.updated_at,
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('meeting_weeks')
        .upsert(dbPayload, { onConflict: 'week_start' })
        .select()
        .single()

      if (!error && data) {
        const merged = { ...fullPayload, ...data }
        const rows = localRead()
        localWrite([...rows.filter((x) => x.week_start !== row.week_start), merged])
        return merged
      }

      // Banco ainda não configurado, RLS, coluna/constraint antiga etc. não podem
      // derrubar a tela. O módulo continua funcionando localmente.
      if (error) console.warn('meeting_weeks: usando armazenamento local:', error.message)
    } catch (error) {
      console.warn('meeting_weeks: falha de rede, usando armazenamento local:', error?.message || error)
    }
  }

  const rows = localRead()
  const next = rows.filter((x) => x.week_start !== row.week_start)
  next.push(fullPayload)
  localWrite(next)
  return fullPayload
}

export async function ensureMeetingWeek(weekStart = getWeekStart()) {
  const existing = await loadMeetingWeek(weekStart)

  const looksLikeFallback = existing && (
    !Array.isArray(existing.parts) || existing.parts.length < 6 ||
    !String(existing.source_url || '').includes('/wol/')
  )
  if (existing && (import.meta.env.DEV || looksLikeFallback)) {
    try {
      const fresh = await importCurrentMeeting(weekStart)
      fresh.assignments = mergeAssignments(existing, fresh)
      fresh.settings = { ...(fresh.settings || {}), ...(existing.settings || {}) }
      return await saveMeetingWeek(fresh)
    } catch {
      return existing
    }
  }

  if (existing) return existing

  try {
    const fresh = await importCurrentMeeting(weekStart)
    const previous = await loadMeetingWeek(getPreviousWeekStart(weekStart))
    if (previous) {
      fresh.assignments = mergeAssignments(previous, fresh)
      fresh.settings = { ...(fresh.settings || {}), ...(previous.settings || {}) }
    }
    return await saveMeetingWeek(fresh)
  } catch (error) {
    const fallback = fallbackMeetingWeek(weekStart)
    const previous = await loadMeetingWeek(getPreviousWeekStart(weekStart)) || localRead().find((x) => x.week_start !== weekStart)
    if (previous) {
      fallback.assignments = mergeAssignments(previous, fallback)
      fallback.settings = { ...(fallback.settings || {}), ...(previous.settings || {}) }
    }
    fallback.import_error = error?.message || 'Não foi possível atualizar automaticamente.'
    return await saveMeetingWeek(fallback)
  }
}

export async function ensureCurrentMeeting() {
  return ensureMeetingWeek(getWeekStart())
}

export async function refreshMeetingWeek(weekStart = getWeekStart()) {
  const current = await loadMeetingWeek(weekStart)

  try {
    const fresh = await importCurrentMeeting(weekStart)
    if (current) {
      fresh.assignments = mergeAssignments(current, fresh)
      fresh.settings = { ...(fresh.settings || {}), ...(current.settings || {}) }
    }
    return saveMeetingWeek(fresh)
  } catch (error) {
    const fallback = current || fallbackMeetingWeek(weekStart)
    fallback.import_error = error?.message || 'Não foi possível atualizar automaticamente.'
    return saveMeetingWeek(fallback)
  }
}

export async function refreshCurrentMeeting() {
  return refreshMeetingWeek(getWeekStart())
}

export async function updateMeetingAssignments(weekStart, assignments, settings) {
  const current = await loadMeetingWeek(weekStart)
  const row = {
    ...(current || fallbackMeetingWeek(weekStart)),
    assignments: { ...defaultAssignments(), ...(assignments || {}) },
    settings: { ...(current?.settings || {}), ...(settings || {}) },
  }
  return saveMeetingWeek(row)
}


export function partStartTimes(meeting) {
  const base = meeting?.settings?.meeting_time || '19:30'
  const [h, m] = String(base).slice(0,5).split(':').map(Number)
  let minutes = (Number.isFinite(h) ? h : 19) * 60 + (Number.isFinite(m) ? m : 30)
  const out = {}
  out.opening = minutes

  // Sequência visual aprovada para a reunião de meio de semana:
  // 19:30 cântico/oracão, 19:35 comentários, 19:36 parte 1.
  minutes += 6
  for (const part of (meeting?.parts || [])) {
    out[part.number] = minutes
    minutes += Number(part.duration) || 0
    if (part.number === 3) minutes += 1 // transição para Faça Seu Melhor no Ministério
    if (part.number === 6) minutes += 6 // cântico intermediário + transição
  }
  out.closing_review = minutes
  out.closing_song = minutes + 4
  return out
}
export function minutesToTime(total) {
  const n = Number(total)
  if (!Number.isFinite(n)) return '—'
  const h = Math.floor(n / 60) % 24
  const m = Math.round(n % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

export function shortMemberName(value = '') {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')
  return `${parts[0]} ${parts[parts.length - 1]}`
}

export function memberDisplayName(member) {
  return shortMemberName(member?.name || member?.full_name || '')
}

export function assignmentNames(assignment, members) {
  const ids = Array.isArray(assignment) ? assignment : []
  return ids.map((id) => memberDisplayName(members.find((m) => m.id === id))).filter(Boolean).join(' & ')
}

export function fallbackMeetingWeek(weekStart = getWeekStart()) {
  const start = new Date(`${weekStart}T12:00:00`)
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const end = new Date(start); end.setDate(end.getDate() + 6)
  const format = (d) => `${d.getDate()} de ${monthNames[d.getMonth()]}`

  // Fallback curto da semana atual 07/09–13/09/2026, confirmado na fonte oficial.
  // Isso mantém a reunião funcional mesmo se a Edge Function estiver temporariamente indisponível.
  if (weekStart === '2026-09-07') {
    return {
      week_start: weekStart,
      week_end: '2026-09-13',
      source_url: 'https://wol.jw.org/bzs/wol/d/r402/lp-lsb/202026252',
      source_title: 'Viva e Ensine Igual a Jesus — 2026',
      bible_text: 'JEREMIAS 32-33',
      parts: [
        { number: 1, title: 'Meditar nas qualidades de Jeová fortalece a nossa fé', duration: 10 },
        { number: 2, title: 'Joias espirituais', duration: 10 },
        { number: 3, title: 'Leitura da Bíblia — Jer. 32:6-11', duration: 4 },
        { number: 4, title: 'Iniciando conversas', duration: 3, subtitle: 'DE CASA EM CASA — Ofereça um estudo bíblico.' },
        { number: 5, title: 'Iniciando conversas', duration: 4, subtitle: 'TESTEMUNHO INFORMAL — Ofereça um estudo bíblico.' },
        { number: 6, title: 'Cultivando o interesse', duration: 5, subtitle: 'DE CASA EM CASA — Ofereça um estudo bíblico.' },
        { number: 7, title: 'Use seu tempo da melhor forma durante a campanha', duration: 15, subtitle: 'Consideração' },
        { number: 8, title: 'Estudo bíblico de congregação — wcg 7', duration: 30 },
      ],
      songs: { opening: 1, opening_title: '', mid: 128, mid_title: '', closing: 143, closing_title: '' },
      assignments: defaultAssignments(),
      settings: {
        meeting_time: '19:30',
        meeting_weekday: 'Quarta-feira',
        cleaning_group: '',
        entrance_indicators: '',
        audio_video: '',
        stage: '',
        auditorium_indicator: '',
        attendants: '',
      },
      imported_at: new Date().toISOString(),
      parsed_week_label: '7–13 DE SETEMBRO',
    }
  }

  // Fallback curto da semana 31/08–06/09/2026, confirmado na fonte oficial.
  if (weekStart === '2026-08-31') {
    return {
      week_start: weekStart,
      week_end: '2026-09-06',
      source_url: 'https://wol.jw.org/pt/wol/d/r5/lp-t/202026249',
      source_title: 'Nossa Vida e Ministério Cristão — Apostila do Mês — 2026',
      bible_text: 'JEREMIAS 31',
      parts: [
        { number: 1, title: '“Farei . . . um novo pacto”', duration: 10 },
        { number: 2, title: 'Joias espirituais', duration: 10 },
        { number: 3, title: 'Leitura da Bíblia — Jer. 31:1-11', duration: 4 },
        { number: 4, title: 'Iniciando conversas', duration: 3, subtitle: 'DE CASA EM CASA' },
        { number: 5, title: 'Iniciando conversas', duration: 4, subtitle: 'TESTEMUNHO INFORMAL' },
        { number: 6, title: 'Explicando suas crenças', duration: 5, subtitle: 'Discurso. — Tema: Por que as Testemunhas de Jeová são neutras em assuntos políticos?' },
        { number: 7, title: 'Seja adaptável — Use o JW.ORG', duration: 15 },
        { number: 8, title: 'Estudo bíblico de congregação', duration: 30 },
      ],
      songs: { opening: 27, opening_title: 'A vitória dos filhos de Deus', mid: 67, mid_title: 'Cântico 67', closing: 132, closing_title: 'Nós somos um' },
      assignments: defaultAssignments(),
      settings: {
        meeting_time: '19:30',
        meeting_weekday: 'Quarta-feira',
        cleaning_group: '',
        entrance_indicators: '',
        audio_video: '',
        stage: '',
        auditorium_indicator: '',
        attendants: '',
      },
      imported_at: new Date().toISOString(),
      parsed_week_label: '31 DE AGOSTO–6 DE SETEMBRO',
    }
  }
  return {
    week_start: weekStart,
    week_end: getWeekEnd(weekStart),
    source_url: meetingSourceUrl(weekStart),
    source_title: 'Reunião Vida e Ministério',
    bible_text: '',
    parts: [],
    songs: { opening: '', opening_title: '', mid: '', mid_title: '', closing: '', closing_title: '' },
    assignments: defaultAssignments(),
    settings: { meeting_time: '19:30', meeting_weekday: 'Quarta-feira', cleaning_group: '', entrance_indicators: '', audio_video: '', stage: '', auditorium_indicator: '', attendants: '' },
    imported_at: new Date().toISOString(),
    parsed_week_label: `${format(start)}–${format(end)}`,
  }
}
