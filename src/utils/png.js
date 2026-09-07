import { formatDate, formatTime, dayNames, scheduleDate, scheduleTime, weekdayIndex } from './constants'

const PURPLE = '#6D45A6'
const PURPLE_DARK = '#4E2C82'
const PURPLE_LIGHT = '#F1EBFA'
const TEXT = '#171717'
const MUTED = '#6F6B76'
const LINE = '#E4DFEA'
const WHITE = '#FFFFFF'

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function fitText(ctx, text, maxWidth) {
  const value = String(text ?? '—')
  if (ctx.measureText(value).width <= maxWidth) return value

  let output = value
  while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) {
    output = output.slice(0, -1)
  }
  return `${output}…`
}

function drawText(ctx, text, x, y, maxWidth, align = 'left') {
  ctx.textAlign = align
  ctx.fillText(fitText(ctx, text, maxWidth), x, y)
}

function rowValue(map, id) {
  return map?.get(id) || 'Não definido'
}

export async function generateSchedulePNG(rows, locs, leaders, terrs) {
  const selected = Array.isArray(rows) ? rows.slice(0, 10) : []

  if (selected.length < 6) {
    throw new Error('É necessário ter pelo menos 6 saídas de campo para gerar o PNG.')
  }

  if (selected.length > 10) {
    throw new Error('O PNG aceita no máximo 10 saídas de campo.')
  }

  const width = 1600
  const headerHeight = 270
  const tableHeaderHeight = 82
  const rowHeight = 112
  const footerHeight = 120
  const height = headerHeight + tableHeaderHeight + selected.length * rowHeight + footerHeight

  const canvas = document.createElement('canvas')
  canvas.width = width * 2
  canvas.height = height * 2
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#FAFAFC'
  ctx.fillRect(0, 0, width, height)

  // Cabeçalho
  ctx.fillStyle = PURPLE
  ctx.fillRect(0, 0, width, headerHeight)

  ctx.fillStyle = WHITE
  ctx.font = '800 34px Arial, sans-serif'
  drawText(ctx, 'OESTE DE MARACANAÚ', 80, 68, 700)

  ctx.font = '800 58px Arial, sans-serif'
  drawText(ctx, 'PROGRAMAÇÃO DO SERVIÇO DE CAMPO', 80, 132, 1050)

  ctx.font = '500 25px Arial, sans-serif'
  drawText(ctx, `${selected.length} saídas de campo · programação para compartilhar`, 80, 202, 1050)

  const dates = selected.map(scheduleDate).filter(Boolean).sort()
  const start = dates[0]
  const end = dates[dates.length - 1] || start
  const dateLabel = start && end && start !== end
    ? `${formatDate(start)} a ${formatDate(end)}`
    : start
      ? formatDate(start)
      : 'Datas a definir'

  roundRect(ctx, 1190, 52, 330, 150, 22, WHITE)
  ctx.fillStyle = PURPLE_DARK
  ctx.font = '800 21px Arial, sans-serif'
  drawText(ctx, 'PERÍODO', 1220, 84, 270)
  ctx.fillStyle = TEXT
  ctx.font = '800 27px Arial, sans-serif'
  drawText(ctx, dateLabel, 1220, 124, 270)
  ctx.fillStyle = MUTED
  ctx.font = '500 18px Arial, sans-serif'
  drawText(ctx, `Atualizado em ${formatDate(new Date())}`, 1220, 168, 270)

  // Tabela
  const x = 45
  const tableWidth = width - 90
  const tableY = headerHeight

  roundRect(ctx, x, tableY, tableWidth, tableHeaderHeight + selected.length * rowHeight, 18, WHITE, LINE)

  ctx.fillStyle = PURPLE_DARK
  ctx.fillRect(x, tableY, tableWidth, tableHeaderHeight)

  const columns = [
    { key: 'day', label: 'DIA', width: 125 },
    { key: 'time', label: 'HORÁRIO', width: 130 },
    { key: 'location', label: 'LOCAL DE SAÍDA', width: 285 },
    { key: 'leader', label: 'DIRIGENTE', width: 250 },
    { key: 'territory', label: 'TERRITÓRIO', width: 220 },
    { key: 'road', label: 'RUA', width: 250 },
    { key: 'start', label: 'Nº INICIAL', width: 120 },
    { key: 'end', label: 'Nº FINAL', width: 120 },
  ]

  const starts = []
  let cursor = x
  for (const column of columns) {
    starts.push(cursor)
    cursor += column.width
  }

  ctx.fillStyle = WHITE
  ctx.font = '800 19px Arial, sans-serif'
  columns.forEach((column, index) => {
    const center = starts[index] + column.width / 2
    drawText(ctx, column.label, center, tableY + tableHeaderHeight / 2, column.width - 20, 'center')
  })

  selected.forEach((schedule, index) => {
    const y = tableY + tableHeaderHeight + index * rowHeight
    if (index % 2 === 1) {
      ctx.fillStyle = '#FBFAFD'
      ctx.fillRect(x + 1, y, tableWidth - 2, rowHeight)
    }

    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + tableWidth, y)
    ctx.stroke()

    const date = scheduleDate(schedule)
    const weekdayIndexValue = weekdayIndex(schedule)
    const day = date
      ? dayNames[new Date(`${date}T12:00:00`).getDay()].slice(0, 3).toUpperCase()
      : weekdayIndexValue !== null
        ? dayNames[weekdayIndexValue].slice(0, 3).toUpperCase()
        : '—'

    const values = [
      day,
      formatTime(scheduleTime(schedule)),
      rowValue(locs, schedule.location_id),
      rowValue(leaders, schedule.leader_id),
      rowValue(terrs, schedule.territory_id),
      schedule.road_name || 'Não definida',
      schedule.number_start ?? '—',
      schedule.number_end ?? '—',
    ]

    values.forEach((value, columnIndex) => {
      const column = columns[columnIndex]
      const center = starts[columnIndex] + column.width / 2
      const isDay = columnIndex === 0
      const isNumber = columnIndex >= 6
      ctx.fillStyle = isDay ? PURPLE : TEXT
      ctx.font = isDay ? '800 21px Arial, sans-serif' : '600 19px Arial, sans-serif'

      if (isDay) {
        roundRect(ctx, center - 43, y + rowHeight / 2 - 23, 86, 46, 23, PURPLE_LIGHT)
        ctx.fillStyle = PURPLE_DARK
      }

      drawText(
        ctx,
        value,
        isNumber || isDay ? center : starts[columnIndex] + 18,
        y + rowHeight / 2,
        column.width - (isNumber || isDay ? 18 : 34),
        isNumber || isDay ? 'center' : 'left'
      )
    })
  })

  // Rodapé
  const footerY = tableY + tableHeaderHeight + selected.length * rowHeight
  ctx.fillStyle = PURPLE_LIGHT
  ctx.fillRect(0, footerY, width, footerHeight)

  ctx.fillStyle = PURPLE_DARK
  ctx.font = '800 23px Arial, sans-serif'
  drawText(ctx, 'Oeste de Maracanaú · Organização do serviço de campo', 70, footerY + 43, 900)

  ctx.fillStyle = MUTED
  ctx.font = '500 19px Arial, sans-serif'
  drawText(ctx, 'Proclamando as boas novas com ordem e alegria.', 70, footerY + 83, 900)

  ctx.fillStyle = PURPLE_DARK
  ctx.font = '800 20px Arial, sans-serif'
  drawText(ctx, '“Jeová abençoe o nosso serviço!”', 1530, footerY + 62, 500, 'right')

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('O navegador não conseguiu criar o arquivo PNG.'))
    }, 'image/png', 1)
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `programacao-oeste-maracanau-${selected.length}-saidas.png`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1500)

  return true
}
