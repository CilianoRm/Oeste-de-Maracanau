import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

function clean(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim()
}
function headings(html: string) {
  const out: string[] = []
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m
  while ((m = re.exec(html))) out.push(clean(m[2]))
  return out
}
function textOnly(html: string) {
  return clean(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "))
}
function weekEnd(start: string) {
  const d = new Date(`${start}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 6)
  return d.toISOString().slice(0, 10)
}
function wednesday(start: string) {
  const d = new Date(`${start}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 2)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
function sourceUrl(start: string) {
  const d = wednesday(start)
  return `https://wol.jw.org/pt/wol/dt/r5/lp-t/${d.year}/${d.month}/${d.day}`
}
function parse(start: string, html: string) {
  const hs = headings(html)
  const body = textOnly(html)
  const bible = hs.find((h) => /^[A-ZÇÃÕÉÊÁÍÓÚÜ\s-]+\d+/.test(h) && !/APOSTILA|REUNIÃO/i.test(h)) || ""
  const parts: any[] = []
  for (const h of hs) {
    const m = h.match(/^([1-8])\.\s*(.+)$/)
    if (m) parts.push({ number: Number(m[1]), title: m[2].replace(/[“”]/g, '"').trim(), duration: null })
  }
  const durationRe = /(?:^|\s)([1-8])\.\s*[^()]{1,180}\((\d+)\s*min\.?\)/gi
  let dm
  while ((dm = durationRe.exec(body))) {
    const part = parts.find((p) => p.number === Number(dm[1]))
    if (part) part.duration = Number(dm[2])
  }
  const songNumbers = [...body.matchAll(/Cântico\s+(\d+)/gi)].map((m) => Number(m[1]))
  return {
    week_start: start,
    week_end: weekEnd(start),
    source_url: sourceUrl(start),
    source_title: hs.find((h) => /APOSTILA DA REUNIÃO VIDA E MINISTÉRIO/i.test(h)) || "Apostila Vida e Ministério",
    bible_text: bible,
    parts,
    songs: { opening: songNumbers[0] || "", mid: songNumbers[1] || "", closing: songNumbers[songNumbers.length - 1] || "" },
    assignments: {
      opening_prayer: [], president: [], part_1: [], part_2: [], part_3: [], part_4: [], part_5: [], part_6: [],
      part_7: [], part_8_conductor: [], part_8_reader: [], closing_prayer: [],
      cleaning_group: [], entrance_indicators: [], audio_video: [], stage: [], auditorium_indicator: [], attendants: []
    },
    settings: { meeting_time: "19:30", meeting_weekday: "Quarta-feira", cleaning_group: "", entrance_indicators: "", audio_video: "", stage: "", auditorium_indicator: "", attendants: "" },
    imported_at: new Date().toISOString(),
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const url = new URL(req.url)
    const start = url.searchParams.get("week_start")
    if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return new Response(JSON.stringify({ error: "week_start inválido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } })
    }

    const source = sourceUrl(start)
    const upstream = await fetch(source, { headers: { "User-Agent": "Oeste-de-Maracanau/1.0" } })
    if (!upstream.ok) throw new Error(`Fonte oficial respondeu ${upstream.status}`)
    const html = await upstream.text()
    const payload = parse(start, html)

    return new Response(JSON.stringify(payload), { headers: { ...cors, "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Falha ao importar a programação" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } })
  }
})
