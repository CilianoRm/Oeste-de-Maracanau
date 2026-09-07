import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ExternalLink, RefreshCw, ShieldCheck, Download, Clock3, BookOpen, UsersRound } from 'lucide-react'
import { assignmentNames, ensureCurrentMeeting, getMeetingWednesday, refreshCurrentMeeting, partStartTimes, minutesToTime } from '../services/meeting'
import { formatDate } from '../utils/constants'
import { generateMeetingPDF, generateMeetingPNG } from '../utils/meetingPng'

function Role({ label, value }) {
  return <div className="meeting-role"><span>{label}</span><b>{value || '—'}</b></div>
}

export function Meeting({ data, isAdmin, onAdmin, onBack }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const members = data.members || []
  const groups = data.groups || []

  const names = useMemo(() => (key) => assignmentNames(meeting?.assignments?.[key], members), [meeting, members])

  const load = async () => {
    setLoading(true)
    try {
      const row = await ensureCurrentMeeting()
      setMeeting(row)
      if (row?.import_error) setMessage(`Atualização automática: ${row.import_error}`)
      else setMessage('')
    } catch (e) {
      setMessage(e?.message || 'Não foi possível carregar a programação.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const update = async () => {
    setRefreshing(true); setMessage('')
    try {
      const row = await refreshCurrentMeeting()
      setMeeting(row)
      if (row?.import_error) setMessage(`Atualização automática: ${row.import_error}`)
      else setMessage('Programação atualizada com a fonte oficial.')
    } catch (e) {
      setMessage(`Não foi possível atualizar agora. ${e?.message || ''}`)
    } finally { setRefreshing(false) }
  }

  const downloadPdf = async () => {
    if (!meeting) return
    try {
      await generateMeetingPDF(meeting, members, groups)
    } catch (e) {
      setMessage(e?.message || 'Não foi possível gerar o PDF.')
    }
  }

  const downloadPng = async () => {
    if (!meeting) return
    try {
      await generateMeetingPNG(meeting, members, groups)
    } catch (e) {
      setMessage(e?.message || 'Não foi possível gerar a imagem.')
    }
  }

  if (loading) return <div className="meeting-page"><div className="meeting-loading"><div className="spinner"/><b>Carregando a programação da semana…</b><span>O sistema verifica automaticamente a semana atual.</span></div></div>
  if (!meeting) return <div className="meeting-page"><div className="meeting-empty"><b>Programação não encontrada.</b><button className="primary-small" onClick={load}>Tentar novamente</button></div></div>

  const w = getMeetingWednesday(meeting.week_start)
  const parts = meeting.parts || []
  const p = (n) => parts.find((x) => Number(x.number) === n)
  const times = partStartTimes(meeting)
  const source = meeting.source_url || '#'

  return <div className="meeting-page">
    <header className="meeting-top">
      <div>
        <button className="back-inline" onClick={onBack}><ArrowLeft size={17}/> Voltar</button>
        <span className="eyebrow">REUNIÃO VIDA E MINISTÉRIO</span>
        <h1>Reunião de meio de semana</h1>
        <p>{formatDate(meeting.week_start)} – {formatDate(meeting.week_end)} · {meeting.bible_text || 'Programação semanal'}</p>
      </div>
      <div className="meeting-actions">
        <a className="secondary-btn" href={source} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Fonte oficial</a>
        <button className="secondary-btn" onClick={update} disabled={refreshing}><RefreshCw size={16}/>{refreshing ? 'Atualizando…' : 'Atualizar'}</button>
        {isAdmin && <button className="primary-small" onClick={onAdmin}><ShieldCheck size={16}/> Administrar</button>}
      </div>
    </header>

    {message && <div className="meeting-message">{message}</div>}

    <section className="meeting-paper">
      <div className="meeting-paper-title">
        <b>Visão geral da semana</b>
        <strong>{formatDate(meeting.week_start)}–{formatDate(meeting.week_end)}</strong>
        <b>Oeste de Maracanaú</b>
      </div>

      <div className="meeting-banner">
        <b>Reunião de meio de semana | {meeting.settings?.meeting_time || '19:30'} {meeting.settings?.meeting_weekday || 'quarta-feira'}, {String(w.day).padStart(2,'0')}/{String(w.month).padStart(2,'0')}/{w.year}</b>
      </div>

      <div className="meeting-opening">
        <div><strong>{meeting.settings?.meeting_time || '19:30'}</strong><span>Cântico {meeting.songs?.opening || '—'}{meeting.songs?.opening_title ? ` – ${meeting.songs.opening_title}` : ''}</span><span>Comentários iniciais</span></div>
        <div><Role label="Oração inicial" value={names('opening_prayer')}/><Role label="Presidente" value={names('president')}/></div>
      </div>

      <MeetingSection color="teal" title="TESOUROS DA PALAVRA DE DEUS">
        {[1,2,3].map((n) => <MeetingPart key={n} part={p(n)} value={names(`part_${n}`)} time={minutesToTime(times[n])} />)}
      </MeetingSection>

      <MeetingSection color="gold" title="FAÇA SEU MELHOR NO MINISTÉRIO">
        {[4,5,6].map((n) => <MeetingPart key={n} part={p(n)} value={names(`part_${n}`)} time={minutesToTime(times[n])} />)}
      </MeetingSection>

      <MeetingSection color="red" title="NOSSA VIDA CRISTÃ" song={meeting.songs?.mid ? `Cântico ${meeting.songs.mid}` : ''}>
        <MeetingPart part={p(7)} value={names('part_7')} time={minutesToTime(times[7])} />
        <MeetingPart part={p(8)} value={names('part_8_conductor')} second={names('part_8_reader')} time={minutesToTime(times[8])} />
      </MeetingSection>

      <div className="meeting-closing">
        <div><span>Revisão / Prévia / Anúncios (3 min)</span><span>Cântico {meeting.songs?.closing || '—'}{meeting.songs?.closing_title ? ` – ${meeting.songs.closing_title}` : ''}</span></div>
        <Role label="Oração final" value={names('closing_prayer')}/>
      </div>

      <div className="meeting-cleaning">🧹 <b>Limpeza Pós-Reunião – {groupName(meeting.settings?.cleaning_group, groups)}</b></div>

      <div className="meeting-mechanical-title">☷ <b>DESIGNAÇÕES MECÂNICAS DE MEIO DE SEMANA</b></div>
      <div className="meeting-mechanical">
        <span>Indicadores da Entrada: <b>{names('entrance_indicators') || '—'}</b></span>
        <span>Áudio e Vídeo: <b>{names('audio_video') || '—'}</b></span>
        <span>Palco: <b>{names('stage') || '—'}</b></span>
        <span>Indicador do Auditório: <b>{names('auditorium_indicator') || '—'}</b></span>
        <span>Volantes: <b>{names('attendants') || '—'}</b></span>
      </div>
    </section>

    <div className="meeting-bottom-actions">
      <button className="primary-small" onClick={downloadPdf}><Download size={17}/> Baixar PDF</button>
      <button className="secondary-btn" onClick={downloadPng}><Download size={17}/> PNG</button>
      {isAdmin && <button className="secondary-btn" onClick={onAdmin}><ShieldCheck size={17}/> Alterar pessoas / configurações</button>}
      <a className="meeting-source-link" href={source} target="_blank" rel="noreferrer">Abrir programação completa na fonte oficial</a>
    </div>
  </div>
}

function groupName(value, groups) {
  if (!value) return 'Grupo não definido'
  const group = (groups || []).find((g) => g.id === value)
  return group?.name || value
}

function MeetingSection({ color, title, song, children }) {
  return <section className={`meeting-section ${color}`}>
    <div className="meeting-section-head"><span>{color === 'teal' ? '◇' : color === 'gold' ? '✦' : '♢'}</span><b>{title}</b>{song && <em>{song}</em>}</div>
    <div>{children}</div>
  </section>
}

function MeetingPart({ part, value, second, time }) {
  if (!part) return null
  return <div className="meeting-part">
    <div className="meeting-time"><b>{time || '—'}</b><span>{part.duration ? `${part.duration} min` : '—'}</span></div>
    <div className="meeting-part-main"><b>{part.number}. {part.title}</b>{part.subtitle && <small>{part.subtitle}</small>}</div>
    <div className="meeting-part-person">{second ? `Dirigente: ${value || '—'} · Leitor: ${second}` : value || '—'}</div>
  </div>
}
