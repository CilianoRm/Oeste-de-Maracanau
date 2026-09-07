import { getMeetingWednesday, partStartTimes, minutesToTime, memberDisplayName } from '../services/meeting'

// O desenho abaixo é compartilhado pelo PNG e pelo PDF.
// As proporções seguem o modelo visual aprovado pelo usuário.
const W = 1448
const H = 1931
const COLORS = {
  blue: '#2F75B5', blueLight: '#DCEAF8',
  teal: '#167486', tealLight: '#D9EEF1',
  gold: '#D49300', goldLight: '#F8F1DF',
  red: '#C92218', redLight: '#F4DEDD',
  orange: '#D55A00',
  green: '#397F10', greenLight: '#E1F0D8',
  text: '#101010', white: '#FFFFFF',
}

function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim() }
function rect(ctx, x, y, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h) }
function strokeLine(ctx, x1, y1, x2, y2, color = '#fff', width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
}
function setFont(ctx, size, weight = 400) { ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif` }
function drawText(ctx, value, x, y, opts = {}) {
  const { size = 27, weight = 400, color = COLORS.text, align = 'left', maxWidth } = opts
  setFont(ctx, size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'
  if (maxWidth) ctx.fillText(clean(value), x, y, maxWidth)
  else ctx.fillText(clean(value), x, y)
}
function drawFit(ctx, value, x, y, maxWidth, opts = {}) {
  const { size = 27, minSize = 12, weight = 700, color = COLORS.text, align = 'left' } = opts
  const content = clean(value)
  let s = size
  while (s > minSize) {
    setFont(ctx, s, weight)
    if (ctx.measureText(content).width <= maxWidth) break
    s -= 1
  }
  setFont(ctx, s, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'
  let out = content
  if (ctx.measureText(out).width > maxWidth) {
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1)
    out = `${out.trim()}…`
  }
  ctx.fillText(out, x, y)
  return s
}
function wrapTextLines(ctx, value, maxWidth, opts = {}) {
  const { size = 16, minSize = 12, weight = 400, maxLines = 3 } = opts
  const words = clean(value).split(' ').filter(Boolean)
  if (!words.length) return { lines: [], size }
  let fontSize = size
  while (fontSize >= minSize) {
    setFont(ctx, fontSize, weight)
    const lines = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate
      else { lines.push(line); line = word }
    }
    if (line) lines.push(line)
    if (lines.length <= maxLines) return { lines, size: fontSize }
    fontSize -= 1
  }
  setFont(ctx, minSize, weight)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate
    else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  const clipped = lines.slice(0, maxLines)
  if (lines.length > maxLines && clipped.length) {
    let last = clipped[clipped.length - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    clipped[clipped.length - 1] = `${last.trim()}…`
  }
  return { lines: clipped, size: minSize }
}
function drawWrapped(ctx, value, x, y, maxWidth, opts = {}) {
  const { size = 16, minSize = 12, weight = 400, color = COLORS.text, lineHeight = 18, maxLines = 3 } = opts
  const wrapped = wrapTextLines(ctx, value, maxWidth, { size, minSize, weight, maxLines })
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  setFont(ctx, wrapped.size, weight)
  wrapped.lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight))
  return { ...wrapped, height: wrapped.lines.length * lineHeight }
}

function drawInlineLabelName(ctx, label, name, x, y, maxWidth, opts = {}) {
  const { size = 25, labelWeight = 400, nameWeight = 800, color = COLORS.text } = opts
  let s = size
  const safeLabel = clean(label)
  const safeName = clean(name || '—')
  while (s > 12) {
    setFont(ctx, s, labelWeight); const lw = ctx.measureText(`${safeLabel}: `).width
    setFont(ctx, s, nameWeight); const nw = ctx.measureText(safeName).width
    if (lw + nw <= maxWidth) break
    s -= 1
  }
  ctx.textAlign = 'left'; ctx.fillStyle = color
  setFont(ctx, s, labelWeight); ctx.fillText(`${safeLabel}: `, x, y)
  const lw = ctx.measureText(`${safeLabel}: `).width
  setFont(ctx, s, nameWeight); ctx.fillText(safeName, x + lw, y)
}
function memberName(id, members) {
  const m = (members || []).find((x) => x.id === id)
  return memberDisplayName(m)
}
function roleText(meeting, key, members) {
  const ids = Array.isArray(meeting?.assignments?.[key]) ? meeting.assignments[key] : []
  return ids.map((id) => memberName(id, members)).filter(Boolean).join(' e ')
}
function groupName(value, groups) {
  if (!value) return 'Grupo não definido'
  const group = (groups || []).find((g) => g.id === value)
  return group?.name || value
}
function partTitle(part) { return clean(part?.title || `Parte ${part?.number || ''}`) }
function pad(n) { return String(n).padStart(2, '0') }
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
function compactWeekLabel(startIso, endIso) {
  const s = new Date(`${startIso}T12:00:00`), e = new Date(`${endIso}T12:00:00`)
  if (s.getMonth() === e.getMonth()) return `${pad(s.getDate())}-${pad(e.getDate())} ${MONTHS[e.getMonth()]}`
  return `${pad(s.getDate())} ${MONTHS[s.getMonth()]}-${pad(e.getDate())} ${MONTHS[e.getMonth()]}`
}

// Ícones vetoriais simples — não dependem de fontes/emoji e ficam consistentes no PDF.
function iconDiamond(ctx, x, y, w, h) {
  // Diamante geométrico semelhante ao símbolo do modelo de referência.
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'
  const cx=x+w/2, cy=y+h/2+1
  const pts=[[cx-15,cy-8],[cx-8,cy-17],[cx+8,cy-17],[cx+15,cy-8],[cx,cy+17]]
  ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke()
  strokeLine(ctx,cx-15,cy-8,cx+15,cy-8,'#fff',1.8)
  strokeLine(ctx,cx-8,cy-17,cx,cy+17,'#fff',1.5)
  strokeLine(ctx,cx+8,cy-17,cx,cy+17,'#fff',1.5)
  strokeLine(ctx,cx-15,cy-8,cx-8,cy-17,'#fff',1.5)
  strokeLine(ctx,cx+15,cy-8,cx+8,cy-17,'#fff',1.5)
  ctx.restore()
}
function iconWheat(ctx, x, y, w, h) {
  // Espiga branca fina, como a do quadro original.
  ctx.save(); ctx.strokeStyle='#fff'; ctx.lineWidth=2.1; ctx.lineCap='round'; ctx.lineJoin='round'
  const cx=x+w/2, top=y+9, bottom=y+h-8
  strokeLine(ctx,cx,top,cx,bottom,'#fff',2.1)
  const leaves=[
    [top+7, -7,-5],[top+12, 7,-5],[top+17,-8,-5],[top+22,8,-5],
    [top+27,-8,-4],[top+32,8,-4]
  ]
  for (const [yy,dx,dy] of leaves) {
    ctx.beginPath(); ctx.moveTo(cx,yy); ctx.quadraticCurveTo(cx+dx,yy+dy,cx+dx,yy-9); ctx.stroke()
  }
  ctx.restore()
}
function iconSheep(ctx, x, y, w, h) {
  // Silhueta linear de ovelha/carneiro mais próxima do ícone da referência.
  ctx.save(); ctx.strokeStyle='#fff'; ctx.lineWidth=2.0; ctx.lineCap='round'; ctx.lineJoin='round'
  const cx=x+w/2, cy=y+h/2+1
  ctx.beginPath()
  ctx.moveTo(cx-15,cy+5)
  ctx.quadraticCurveTo(cx-18,cy-3,cx-11,cy-8)
  ctx.quadraticCurveTo(cx-3,cy-13,cx+7,cy-8)
  ctx.quadraticCurveTo(cx+11,cy-8,cx+13,cy-4)
  ctx.stroke()
  ctx.beginPath(); ctx.arc(cx+15,cy-6,5,0.15,Math.PI*1.85); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx+13,cy-10); ctx.quadraticCurveTo(cx+19,cy-15,cx+22,cy-9); ctx.stroke()
  strokeLine(ctx,cx-10,cy+3,cx-11,cy+14,'#fff',2)
  strokeLine(ctx,cx-2,cy+5,cx-2,cy+14,'#fff',2)
  strokeLine(ctx,cx+7,cy+4,cx+8,cy+14,'#fff',2)
  strokeLine(ctx,cx+13,cy+1,cx+15,cy+12,'#fff',2)
  strokeLine(ctx,cx-15,cy+3,cx-20,cy,'#fff',1.8)
  ctx.restore()
}
function iconCleaning(ctx, x, y, w, h) {
  // Conjunto de limpeza (balde + frasco + vassoura), inspirado no modelo aprovado.
  ctx.save(); ctx.strokeStyle='#fff'; ctx.fillStyle='#fff'; ctx.lineWidth=1.9; ctx.lineCap='round'; ctx.lineJoin='round'
  const cx=x+w/2
  // balde
  ctx.beginPath(); ctx.moveTo(cx-18,y+25); ctx.lineTo(cx-14,y+43); ctx.lineTo(cx+2,y+43); ctx.lineTo(cx+5,y+25); ctx.closePath(); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx-6,y+25,11,Math.PI,0); ctx.stroke()
  // frasco
  ctx.strokeRect(cx+6,y+24,9,18); ctx.strokeRect(cx+8,y+19,5,5); strokeLine(ctx,cx+11,y+19,cx+17,y+16,'#fff',1.7)
  // vassoura
  strokeLine(ctx,cx+17,y+10,cx+25,y+39,'#fff',2.2)
  ctx.beginPath(); ctx.moveTo(cx+20,y+36); ctx.lineTo(cx+29,y+36); ctx.lineTo(cx+27,y+44); ctx.lineTo(cx+22,y+44); ctx.closePath(); ctx.stroke()
  ctx.restore()
}
function iconSliders(ctx, x, y, w, h) {
  ctx.save(); ctx.strokeStyle='#fff'; ctx.fillStyle='#fff'; ctx.lineWidth=2.2; ctx.lineCap='round'
  const x1=x+13,x2=x+w-13
  const rows=[{y:y+15,k:x+27},{y:y+27,k:x+40},{y:y+39,k:x+30}]
  rows.forEach(({y:yy,k})=>{strokeLine(ctx,x1,yy,x2,yy,'#fff',2.2); ctx.beginPath(); ctx.arc(k,yy,3.5,0,Math.PI*2); ctx.fill()})
  ctx.restore()
}

function drawSectionHeader(ctx, x, y, w, title, dark, light, icon) {
  rect(ctx,x,y,w,54,light); rect(ctx,x,y,62,54,dark)
  if (icon === 'diamond') iconDiamond(ctx,x,y,62,54)
  if (icon === 'wheat') iconWheat(ctx,x,y,62,54)
  if (icon === 'sheep') iconSheep(ctx,x,y,62,54)
  drawText(ctx,title,x+78,y+37,{size:24,weight:800,color:dark})
}

function renderMeeting(ctx, meeting, members = [], groups = []) {
  const times = partStartTimes(meeting)
  rect(ctx,0,0,W,H,'#fff')
  const x=30, width=W-60

  // Cabeçalho — os 3 elementos usam a mesma linha de base.
  const headerY=47
  drawText(ctx,'Visão geral da semana',x,headerY,{size:30,weight:800})
  drawFit(ctx,compactWeekLabel(meeting.week_start,meeting.week_end),W/2,headerY,500,{size:29,minSize:22,weight:800,align:'center'})
  drawText(ctx,'Oeste de Maracanaú',W-x,headerY,{size:30,weight:800,align:'right'})

  let y=68
  rect(ctx,x,y,width,50,COLORS.blue)
  const wd=getMeetingWednesday(meeting.week_start)
  const weekday=clean(meeting.settings?.meeting_weekday || 'quarta-feira').toLowerCase()
  drawFit(ctx,`Reunião de meio de semana | ${meeting.settings?.meeting_time || '19:30'} ${weekday}, ${pad(wd.day)}/${pad(wd.month)}/${wd.year}`,x+14,y+35,width-28,{size:25,minSize:19,weight:800,color:'#fff'})
  y+=56

  // Abertura
  rect(ctx,x,y,width,70,COLORS.blueLight)
  drawText(ctx,meeting.settings?.meeting_time || '19:30',x+18,y+27,{size:19,weight:800})
  drawFit(ctx,`Cântico ${meeting.songs?.opening || '—'}${meeting.songs?.opening_title ? ` - ${meeting.songs.opening_title}` : ''}`,x+82,y+28,790,{size:25,minSize:17,weight:400})
  drawFit(ctx,`Oração inicial: ${roleText(meeting,'opening_prayer',members) || '—'}`,x+width-15,y+29,470,{size:23,minSize:14,weight:800,align:'right'})
  drawText(ctx,'19:35',x+18,y+59,{size:19,weight:800})
  drawText(ctx,'Comentários iniciais',x+82,y+59,{size:24,weight:400})
  drawFit(ctx,`Presidente: ${roleText(meeting,'president',members) || '—'}`,x+width-15,y+60,470,{size:23,minSize:14,weight:800,align:'right'})
  y+=76

  const configs=[
    {title:'TESOUROS DA PALAVRA DE DEUS',dark:COLORS.teal,light:COLORS.tealLight,icon:'diamond',nums:[1,2,3]},
    {title:'FAÇA SEU MELHOR NO MINISTÉRIO',dark:COLORS.gold,light:COLORS.goldLight,icon:'wheat',nums:[4,5,6]},
    {title:'NOSSA VIDA CRISTÃ',dark:COLORS.red,light:COLORS.redLight,icon:'sheep',nums:[7,8]},
  ]

  for (const config of configs) {
    drawSectionHeader(ctx,x,y,width,config.title,config.dark,config.light,config.icon)
    if (config.nums[0]===7 && meeting.songs?.mid) {
      drawFit(ctx,`Cântico ${meeting.songs.mid}${meeting.songs?.mid_title ? ` - “${meeting.songs.mid_title}”` : ''}`,x+width-15,y+36,540,{size:22,minSize:15,weight:400,align:'right'})
    }
    y+=54

    for (const n of config.nums) {
      const part=(meeting.parts||[]).find((p)=>Number(p.number)===n)
      if(!part) continue
      // As partes 4–6 podem vir com uma instrução complementar relativamente longa
      // na fonte oficial. O quadro cresce para baixo em vez de cortar/sobrepor o texto.
      const subtitleInfo = part.subtitle ? wrapTextLines(ctx, part.subtitle, 800, { size: 15, minSize: 12, weight: 400, maxLines: 3 }) : { lines: [], size: 15 }
      const subtitleExtra = subtitleInfo.lines.length ? Math.max(24, subtitleInfo.lines.length * 17 + 8) : 0
      const h = n===8 ? 72 : Math.max(47, 47 + subtitleExtra)
      rect(ctx,x,y,width,h,config.light)
      drawText(ctx,minutesToTime(times[n]),x+18,y+31,{size:18,weight:800})
      const baseTitle=`${n}. ${partTitle(part)}${part.duration ? ` (${part.duration} min.)` : ''}`
      drawFit(ctx,baseTitle,x+82,y+31,800,{size:24,minSize:16,weight:400})
      if (part.subtitle) {
        drawWrapped(ctx,part.subtitle,x+82,y+55,800,{size:15,minSize:12,weight:400,lineHeight:17,maxLines:3})
      }
      if (n===8) {
        const conductor=roleText(meeting,'part_8_conductor',members)||'—'
        const reader=roleText(meeting,'part_8_reader',members)||'—'
        drawFit(ctx,`Dirigente: ${conductor} - Leitor: ${reader}`,x+width-16,y+43,520,{size:22,minSize:13,weight:800,align:'right'})
      } else {
        drawFit(ctx,roleText(meeting,`part_${n}`,members)||'—',x+width-16,y+31,400,{size:22,minSize:13,weight:800,align:'right'})
      }
      y+=h
    }
  }

  // Encerramento em duas linhas, como a referência.
  rect(ctx,x,y,width,70,COLORS.blueLight)
  drawText(ctx,minutesToTime(times.closing_review),x+18,y+27,{size:18,weight:800})
  drawText(ctx,'Revisão / Prévia / Anúncios (3 min)',x+82,y+28,{size:23,weight:400})
  drawText(ctx,minutesToTime(times.closing_song),x+18,y+59,{size:18,weight:800})
  drawFit(ctx,`Cântico ${meeting.songs?.closing || '—'}${meeting.songs?.closing_title ? ` - ${meeting.songs.closing_title}` : ''}`,x+82,y+59,760,{size:23,minSize:16,weight:400})
  drawFit(ctx,`Oração final: ${roleText(meeting,'closing_prayer',members)||'—'}`,x+width-16,y+59,470,{size:22,minSize:13,weight:800,align:'right'})
  y+=77

  // Limpeza
  rect(ctx,x,y,width,55,COLORS.orange); rect(ctx,x,y,62,55,COLORS.orange); iconCleaning(ctx,x,y,62,55)
  drawFit(ctx,`Limpeza Pós-Reunião – ${groupName(meeting.settings?.cleaning_group,groups)}`,x+76,y+38,width-95,{size:24,minSize:17,weight:800,color:'#fff'})
  y+=72

  // Mecânicas — rótulo normal, nome negrito.
  rect(ctx,x,y,width,54,COLORS.greenLight); rect(ctx,x,y,62,54,COLORS.green); iconSliders(ctx,x,y,62,54)
  drawText(ctx,'DESIGNAÇÕES MECÂNICAS DE MEIO DE SEMANA',x+78,y+37,{size:23,weight:800,color:'#214E15'})
  y+=54
  rect(ctx,x,y,width,91,COLORS.greenLight)
  drawInlineLabelName(ctx,'Indicadores da Entrada',roleText(meeting,'entrance_indicators',members),x+82,y+37,520,{size:23})
  drawInlineLabelName(ctx,'Áudio e Vídeo',roleText(meeting,'audio_video',members),x+630,y+37,360,{size:23})
  drawInlineLabelName(ctx,'Palco',roleText(meeting,'stage',members),x+1010,y+37,390,{size:23})
  drawInlineLabelName(ctx,'Indicador do Auditório',roleText(meeting,'auditorium_indicator',members),x+82,y+77,520,{size:23})
  drawInlineLabelName(ctx,'Volantes',roleText(meeting,'attendants',members),x+630,y+77,720,{size:23})
}

function createMeetingCanvas(meeting, members, groups, scale=2) {
  const canvas=document.createElement('canvas'); canvas.width=W*scale; canvas.height=H*scale
  const ctx=canvas.getContext('2d'); ctx.scale(scale,scale); renderMeeting(ctx,meeting,members,groups)
  return canvas
}

export async function generateMeetingPNG(meeting, members = [], groups = []) {
  const canvas=createMeetingCanvas(meeting,members,groups,2)
  const blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/png',1))
  if(!blob) throw new Error('Não foi possível gerar o PNG.')
  const url=URL.createObjectURL(blob), a=document.createElement('a')
  a.href=url; a.download=`Reuniao_Meio_de_Semana_${meeting.week_start}.png`; a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000); return true
}

function b64ToBytes(dataUrl) {
  const b64=dataUrl.split(',')[1]; const raw=atob(b64); const bytes=new Uint8Array(raw.length)
  for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i)
  return bytes
}
function concatBytes(parts) {
  const total=parts.reduce((n,p)=>n+p.length,0), out=new Uint8Array(total); let o=0
  for(const p of parts){out.set(p,o);o+=p.length} return out
}
function encode(s){return new TextEncoder().encode(s)}

// PDF de uma página com o quadro como imagem JPEG de alta resolução.
function imagePdf(jpegBytes, imgW, imgH) {
  const pageW=595.28, pageH=841.89 // A4 retrato
  const scale=Math.min(pageW/imgW,pageH/imgH), drawW=imgW*scale, drawH=imgH*scale
  const ox=(pageW-drawW)/2, oy=(pageH-drawH)/2
  const content=`q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${ox.toFixed(2)} ${oy.toFixed(2)} cm\n/Im0 Do\nQ\n`
  const objects=[]
  objects[1]=encode('<< /Type /Catalog /Pages 2 0 R >>')
  objects[2]=encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objects[3]=encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`)
  objects[4]=encode(`<< /Length ${encode(content).length} >>\nstream\n${content}endstream`)
  objects[5]=concatBytes([encode(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),jpegBytes,encode('\nendstream')])
  const header=encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'); const parts=[header]; const offsets=[0]; let pos=header.length
  for(let i=1;i<=5;i++){offsets[i]=pos; const pre=encode(`${i} 0 obj\n`), post=encode('\nendobj\n'); parts.push(pre,objects[i],post); pos+=pre.length+objects[i].length+post.length}
  const xrefPos=pos; let xref='xref\n0 6\n0000000000 65535 f \n'
  for(let i=1;i<=5;i++) xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`
  xref+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  parts.push(encode(xref)); return concatBytes(parts)
}

export async function generateMeetingPDF(meeting, members = [], groups = []) {
  const canvas=createMeetingCanvas(meeting,members,groups,2)
  const jpeg=b64ToBytes(canvas.toDataURL('image/jpeg',0.97))
  const pdf=imagePdf(jpeg,canvas.width,canvas.height)
  const blob=new Blob([pdf],{type:'application/pdf'}), url=URL.createObjectURL(blob), a=document.createElement('a')
  a.href=url; a.download=`Reuniao_Meio_de_Semana_${meeting.week_start}.pdf`; a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000); return true
}
