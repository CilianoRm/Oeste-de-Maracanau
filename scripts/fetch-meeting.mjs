import fs from 'node:fs/promises'
import path from 'node:path'

function clean(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function headings(html) {
  const out = []
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m
  while ((m = re.exec(html))) out.push(clean(m[2]))
  return out
}

function mondayIso(now = new Date()) {
  const d = new Date(now)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function sourceUrl(start) {
  const d = new Date(`${start}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 2)
  return `https://wol.jw.org/pt/wol/dt/r5/lp-t/${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`
}

function parse(start, html) {
  const hs = headings(html)
  const text = clean(html)
  const normalized = hs.map((h) => h.replace(/\s+/g, ' ').trim())
  const bible = normalized.find((h) => /^[A-ZÇÃÕÉÊÁÍÓÚÜ\s-]+\d+/.test(h) && !/APOSTILA|REUNIÃO/i.test(h)) || ''
  const parts = []
  for (const h of normalized) {
    const m = h.match(/^([1-8])\.\s*(.+)$/)
    if (m) parts.push({ number: Number(m[1]), title: m[2].replace(/[“”]/g, '"').trim(), duration: null })
  }
  const durationRe = /(?:^|\s)([1-8])\.\s*[^()]{1,180}\((\d+)\s*min\.?\)/gi
  let dm
  while ((dm = durationRe.exec(text))) {
    const part = parts.find((p) => p.number === Number(dm[1]))
    if (part) part.duration = Number(dm[2])
  }
  for (const part of parts) {
    if (part.number < 4 || part.number > 6) continue
    const next = part.number + 1
    const re = new RegExp(String.raw`(?:^|\s)${part.number}\.\s*[^()]{1,180}\(\d+\s*min\.?\)\s*([\s\S]{0,220}?)(?=\s${next}\.\s|\sNOSSA VIDA CRISTÃ|$)`, 'i')
    const m = text.match(re)
    if (m?.[1]) {
      const short = clean(m[1]).replace(/\s*\([^)]*\)\s*$/, '').trim()
      if (short && short.length <= 210) part.subtitle = short
    }
  }
  const songNumbers = [...text.matchAll(/Cântico\s+(\d+)/gi)].map((m) => Number(m[1]))
  if (parts.length < 6) throw new Error(`A fonte abriu, mas só ${parts.length} partes foram identificadas.`)
  return {
    week_start: start,
    week_end: addDays(start, 6),
    source_url: sourceUrl(start),
    source_title: normalized.find((h) => /\d{1,2}[–-]\d{1,2} DE|APOSTILA DA REUNIÃO VIDA E MINISTÉRIO/i.test(h)) || 'Apostila Vida e Ministério',
    bible_text: bible,
    parts,
    songs: {
      opening: songNumbers[0] || '', opening_title: '',
      mid: songNumbers[1] || '', mid_title: '',
      closing: songNumbers.length ? songNumbers[songNumbers.length - 1] : '', closing_title: '',
    },
    assignments: {},
    settings: { meeting_time: '19:30', meeting_weekday: 'Quarta-feira' },
    imported_at: new Date().toISOString(),
    generated_by: 'github-actions-wol-fetch',
  }
}

const start = process.argv[2] || mondayIso()
const source = sourceUrl(start)
console.log(`Buscando programação oficial: ${source}`)
const response = await fetch(source, { headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Mozilla/5.0 Oeste-de-Maracanau/1.0' } })
if (!response.ok) throw new Error(`Fonte oficial respondeu ${response.status}`)
const html = await response.text()
const payload = parse(start, html)
const output = path.resolve('public/meeting-current.json')
await fs.writeFile(output, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`Programação salva em ${output}: ${payload.bible_text}, ${payload.parts.length} partes.`)
