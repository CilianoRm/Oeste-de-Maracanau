import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save, ExternalLink, UsersRound, Image, CalendarDays, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { ensureMeetingWeek, refreshMeetingWeek, updateMeetingAssignments, assignmentNames, memberDisplayName, getWeekStart, shiftWeekStart } from '../services/meeting'
import { generateMeetingPDF, generateMeetingPNG } from '../utils/meetingPng'
import { formatDate } from '../utils/constants'

const roleLabels = {
  opening_prayer: 'Oração inicial',
  president: 'Presidente',
  part_1: 'Parte 1',
  part_2: 'Parte 2',
  part_3: 'Leitura da Bíblia',
  part_4: 'Parte 4',
  part_5: 'Parte 5',
  part_6: 'Parte 6',
  part_7: 'Parte 7',
  part_8_conductor: 'Parte 8 — Dirigente',
  part_8_reader: 'Parte 8 — Leitor',
  closing_prayer: 'Oração final',
}

const mechanicalLabels = {
  entrance_indicators: 'Indicadores da entrada',
  audio_video: 'Áudio e vídeo',
  stage: 'Palco',
  auditorium_indicator: 'Indicador do auditório',
  attendants: 'Volantes / atendentes',
}

export function MeetingAdmin({ data, setToast }) {
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart())
  const [meeting, setMeeting] = useState(null)
  const [assignments, setAssignments] = useState({})
  const [settings, setSettings] = useState({})
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const members = useMemo(() => (data.members || []).filter((x) => x.active !== false).sort((a,b) => (a.name || '').localeCompare(b.name || '', 'pt-BR')), [data.members])
  const groups = useMemo(() => (data.groups || []).filter((x) => x.active !== false).sort((a,b) => (a.name || '').localeCompare(b.name || '', 'pt-BR')), [data.groups])

  const applyRow = (row) => {
    setMeeting(row)
    setAssignments(row?.assignments || {})
    setSettings(row?.settings || {})
  }

  const load = async (weekStart = selectedWeek) => {
    setBusy(true)
    try {
      const row = await ensureMeetingWeek(weekStart)
      applyRow(row)
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Não foi possível carregar a reunião.' })
    } finally { setBusy(false) }
  }

  useEffect(() => { load(selectedWeek) }, [selectedWeek])

  const chooseDate = (value) => {
    if (!value) return
    setSelectedWeek(getWeekStart(new Date(`${value}T12:00:00`)))
  }

  const update = async () => {
    setRefreshing(true)
    try {
      const row = await refreshMeetingWeek(selectedWeek)
      applyRow(row)
      setToast({ message: 'Temas desta semana atualizados. As designações cadastradas foram preservadas.' })
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Não foi possível atualizar a programação.' })
    } finally { setRefreshing(false) }
  }

  const save = async () => {
    if (!meeting) return
    setSaving(true)
    try {
      const row = await updateMeetingAssignments(meeting.week_start, assignments, settings)
      applyRow(row)
      setToast({ message: 'Designações, grupo de limpeza e configurações salvas.' })
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Não foi possível salvar.' })
    } finally { setSaving(false) }
  }

  const pdf = async () => {
    if (!meeting) return
    try {
      await generateMeetingPDF({ ...meeting, assignments, settings }, members, groups)
      setToast({ message: 'PDF da reunião gerado.' })
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Não foi possível gerar o PDF.' })
    }
  }

  const png = async () => {
    if (!meeting) return
    try {
      await generateMeetingPNG({ ...meeting, assignments, settings }, members, groups)
      setToast({ message: 'PNG da reunião gerado.' })
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Não foi possível gerar o PNG.' })
    }
  }

  if (busy) return <div className="admin-content"><div className="meeting-loading"><div className="spinner"/><b>Carregando reunião…</b></div></div>

  const setRole = (key, ids) => setAssignments((old) => ({ ...old, [key]: ids }))

  return <div className="admin-content">
    <div className="meeting-admin-head">
      <div><span className="eyebrow">REUNIÃO MEIO DE SEMANA</span><h2>Programação e designações</h2><p>Escolha a semana, confira os temas e defina as designações usando os irmãos cadastrados.</p></div>
      <div className="meeting-admin-actions">
        <button className="secondary-btn" onClick={update} disabled={refreshing}><RefreshCw size={16}/>{refreshing ? 'Atualizando…' : 'Atualizar temas'}</button>
        <button className="primary-small" onClick={save} disabled={saving}><Save size={16}/>{saving ? 'Salvando…' : 'Salvar designações'}</button>
        <button className="primary-small" onClick={pdf}><Image size={16}/> Baixar PDF</button>
        <button className="secondary-btn" onClick={png}><Image size={16}/> PNG</button>
      </div>
    </div>

    <div className="meeting-week-picker">
      <button type="button" className="secondary-btn icon-only" onClick={() => setSelectedWeek(shiftWeekStart(selectedWeek, -1))} title="Semana anterior"><ChevronLeft size={18}/></button>
      <label><span>Escolher semana</span><input type="date" value={selectedWeek} onChange={(e) => chooseDate(e.target.value)}/></label>
      <button type="button" className="secondary-btn icon-only" onClick={() => setSelectedWeek(shiftWeekStart(selectedWeek, 1))} title="Próxima semana"><ChevronRight size={18}/></button>
      <button type="button" className="secondary-btn" onClick={() => setSelectedWeek(getWeekStart())}>Semana atual</button>
      <div className="meeting-week-range"><CalendarDays size={16}/><b>{formatDate(selectedWeek)} – {formatDate(meeting?.week_end)}</b></div>
    </div>

    {meeting?.import_error && <div className="admin-note"><CalendarDays size={18}/><div><b>A fonte oficial não foi atualizada automaticamente nesta tentativa.</b><span>{meeting.import_error} O sistema manteve a programação disponível para não interromper o uso.</span></div></div>}

    <div className="meeting-admin-summary">
      <div><span>Semana</span><b>{formatDate(meeting.week_start)} – {formatDate(meeting.week_end)}</b></div>
      <div><span>Bíblia</span><b>{meeting.bible_text || '—'}</b></div>
      <a href={meeting.source_url} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Fonte oficial</a>
    </div>

    <div className="meeting-admin-grid">
      <section className="meeting-admin-card">
        <div className="section-head"><div><span className="eyebrow">PARTICIPANTES</span><h3>Quem fará cada parte</h3></div><UsersRound size={19}/></div>
        {Object.entries(roleLabels).map(([key, label]) => (
          <MemberField key={key} label={label} value={assignments[key] || []} members={members} onChange={(ids) => setRole(key, ids)} />
        ))}
      </section>

      <section className="meeting-admin-card">
        <div className="section-head"><div><span className="eyebrow">CONFIGURAÇÃO</span><h3>Informações da reunião</h3></div></div>
        <label>Horário<input value={settings.meeting_time || '19:30'} onChange={(e) => setSettings({ ...settings, meeting_time: e.target.value })}/></label>
        <label>Dia<input value={settings.meeting_weekday || 'Quarta-feira'} onChange={(e) => setSettings({ ...settings, meeting_weekday: e.target.value })}/></label>
        <label>Grupo de limpeza
          <select value={settings.cleaning_group || ''} onChange={(e) => setSettings({ ...settings, cleaning_group: e.target.value })}>
            <option value="">Selecionar grupo</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name || `Grupo ${g.number || ''}`}</option>)}
          </select>
        </label>

        <div className="mechanical-admin-head"><Wrench size={17}/><div><span className="eyebrow">PARTES MECÂNICAS</span><b>Escolha irmãos cadastrados</b></div></div>
        {Object.entries(mechanicalLabels).map(([key, label]) => (
          <MemberField key={key} label={label} value={assignments[key] || []} members={members} onChange={(ids) => setRole(key, ids)} />
        ))}
      </section>
    </div>

    <div className="meeting-admin-note">
      <b>Como funciona por semana</b>
      <span>Use o seletor acima para ir à semana que desejar. Cada semana guarda suas próprias designações. Ao abrir uma semana nova, o sistema pode usar a semana anterior como ponto de partida e você ajusta somente o que mudou.</span>
    </div>
  </div>
}

function MemberField({ label, value, members, onChange }) {
  const [open, setOpen] = useState(false)
  const safeValue = Array.isArray(value) ? value : []
  const names = assignmentNames(safeValue, members)
  return <div className="member-field">
    <button type="button" className="member-field-button" onClick={() => setOpen(!open)}>
      <span>{label}</span><b>{names || 'Selecionar pessoa(s)'}</b><span>{open ? '−' : '+'}</span>
    </button>
    {open && <div className="member-picker">
      <div className="member-picker-head">Selecione uma ou mais pessoas — será exibido apenas nome + último sobrenome</div>
      <div className="member-picker-list">
        {members.map((m) => {
          const id = m.id
          const checked = safeValue.includes(id)
          return <label key={id} className="member-check">
            <input type="checkbox" checked={checked} onChange={(e) => {
              const next = e.target.checked ? [...safeValue, id] : safeValue.filter((x) => x !== id)
              onChange(next)
            }}/>
            <span>{memberDisplayName(m) || 'Sem nome'}</span>
          </label>
        })}
      </div>
      <button className="secondary-btn" type="button" onClick={() => setOpen(false)}>Concluir</button>
    </div>}
  </div>
}
