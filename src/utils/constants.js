export const PUBLIC_PASSWORD = 'OesteM131268'
export const APP_NAME = 'Oeste de Maracanaú'
export const NAV_ITEMS = [
  { key: 'home', label: 'Início', icon: 'Home' },
  { key: 'map', label: 'Mapa', icon: 'Map' },
  { key: 'field', label: 'Campo', icon: 'CalendarDays' },
  { key: 'groups', label: 'Grupos', icon: 'UsersRound' },
  { key: 'more', label: 'Mais', icon: 'Menu' }
]
export const dayNames = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

export function normalizeDate(date) {
  if (!date) return null
  if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date
  const value = String(date).trim()
  if (!value) return null
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatDate = (date) => {
  const d = normalizeDate(date)
  return d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d) : '—'
}

export const formatShortDate = (date) => {
  const d = normalizeDate(date)
  return d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d) : '—'
}

export const formatTime = (time) => String(time || '').slice(0, 5) || '—'

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const daysSince = (date) => {
  const d = normalizeDate(date)
  if (!d) return null
  const today = normalizeDate(todayISO())
  return Math.max(0, Math.floor((today - d) / 86400000))
}

export function weekdayIndex(schedule) {
  if (Number.isInteger(Number(schedule?.weekday))) return Number(schedule.weekday)
  const idx = dayNames.findIndex(x => x.toLowerCase() === String(schedule?.weekday_name || '').toLowerCase())
  return idx >= 0 ? idx : null
}

export function nextDateForWeekday(weekday, from = new Date(), weekOffset = 0) {
  const n = Number(weekday)
  if (!Number.isInteger(n) || n < 0 || n > 6) return null
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const delta = (n - d.getDay() + 7) % 7
  d.setDate(d.getDate() + delta + (Number(weekOffset) || 0) * 7)
  return d.toISOString().slice(0, 10)
}

export function scheduleDate(schedule, weekOffset = 0) {
  if (schedule?.service_date) {
    const d = normalizeDate(schedule.service_date)
    if (!d) return null
    d.setDate(d.getDate() + (Number(weekOffset) || 0) * 7)
    return d.toISOString().slice(0, 10)
  }
  return nextDateForWeekday(weekdayIndex(schedule), new Date(), weekOffset)
}

export function scheduleTime(schedule) {
  return schedule?.start_time || schedule?.time || ''
}

export function scheduleLabel(schedule) {
  const date = scheduleDate(schedule)
  const weekday = weekdayIndex(schedule)
  return date ? formatDate(date) : (weekday !== null ? dayNames[weekday] : 'Data não definida')
}


function isoLocal(date) {
  const d = normalizeDate(date)
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekStartISO(date = new Date()) {
  const d = normalizeDate(date) || new Date()
  d.setHours(12, 0, 0, 0)
  const daysFromMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - daysFromMonday)
  return isoLocal(d)
}

export function addDaysISO(date, days = 0) {
  const d = normalizeDate(date)
  if (!d) return null
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + Number(days || 0))
  return isoLocal(d)
}

export function addWeeksISO(weekStart, weeks = 0) {
  return addDaysISO(weekStartISO(weekStart), Number(weeks || 0) * 7)
}

export function weekEndISO(weekStart) {
  return addDaysISO(weekStartISO(weekStart), 6)
}

export function dateForWeekday(weekStart, weekday) {
  const n = Number(weekday)
  if (!Number.isInteger(n) || n < 0 || n > 6) return null
  // dayNames usa 0=domingo; a semana exibida começa na segunda-feira.
  const offset = n === 0 ? 6 : n - 1
  return addDaysISO(weekStartISO(weekStart), offset)
}

export function weekRangeLabel(weekStart) {
  const start = weekStartISO(weekStart)
  const end = weekEndISO(start)
  return `${formatDate(start)} – ${formatDate(end)}`
}

function scheduleWeekday(schedule) {
  const explicit = weekdayIndex(schedule)
  if (explicit !== null) return explicit
  const d = normalizeDate(schedule?.service_date)
  return d ? d.getDay() : null
}

function scheduleSlot(schedule) {
  const weekday = scheduleWeekday(schedule)
  return `${weekday ?? 'x'}|${formatTime(scheduleTime(schedule))}`
}

/**
 * Retorna somente a programação realmente cadastrada para a semana escolhida
 * (segunda-feira a domingo). Não existe programação-base nem reaproveitamento
 * automático de semanas anteriores/futuras.
 */
export function schedulesForWeek(schedules = [], requestedWeek = new Date()) {
  const target = weekStartISO(requestedWeek)
  const source = Array.isArray(schedules) ? schedules.filter(Boolean) : []

  return source
    .filter((row) => row.service_date && weekStartISO(row.service_date) === target)
    .map((row) => ({
      ...row,
      _virtual: false,
      _sourceId: row.id || null,
      _weekStart: target,
      _displayDate: row.service_date,
    }))
    .sort((a, b) => {
      const aKey = `${a.service_date || '9999-99-99'} ${scheduleTime(a) || ''}`
      const bKey = `${b.service_date || '9999-99-99'} ${scheduleTime(b) || ''}`
      return aKey.localeCompare(bKey)
    })
}

