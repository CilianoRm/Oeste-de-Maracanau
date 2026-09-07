import { CalendarClock, Flag, MapPin, UsersRound, ArrowRight, Sparkles } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import {
  formatDate,
  formatTime,
  dayNames,
  scheduleDate,
  scheduleTime,
  weekdayIndex,
} from '../utils/constants'
import { buildIndications } from '../utils/indications'

export function Home({ data, setPage }) {
  const territories = data.territories || []
  const groups = data.groups || []
  const members = data.members || []
  const locations = data.locations || []
  const schedules = data.schedules || []
  const history = data.history || []

  const next = schedules
    .filter((s) => s.status !== 'cancelled')
    .map((s) => ({
      ...s,
      _date: scheduleDate(s),
    }))
    .filter((s) => s._date)
    .sort((a, b) => {
      const aKey = `${a._date} ${scheduleTime(a) || ''}`
      const bKey = `${b._date} ${scheduleTime(b) || ''}`
      return aKey.localeCompare(bKey)
    })
    .slice(0, 4)

  const leaders = new Map(members.map((x) => [x.id, x.name||x.full_name||'Sem nome']))
  const locs = new Map(locations.map((x) => [x.id, x.name]))
  const terrs = new Map(territories.map((x) => [x.id, x.name]))

  const indications = buildIndications(territories, history)

  return (
    <div className="page">
      <div className="page-top">
        <div>
          <span className="eyebrow">VISÃO GERAL</span>
          <h1>Olá! 👋</h1>
          <p>Que bom ter você por aqui.</p>
        </div>
        <button className="notification" type="button" aria-label="Notificações">
          ◔
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Flag}
          label="Territórios"
          value={territories.filter((x) => x.active).length}
          hint="cadastrados"
        />

        <StatCard
          icon={UsersRound}
          label="Grupos"
          value={groups.filter((x) => x.active).length}
          hint="ativos"
        />

        <StatCard
          icon={CalendarClock}
          label="Próximo serviço"
          value={next[0] ? formatTime(scheduleTime(next[0])) : '—'}
          hint={next[0] ? formatDate(next[0]._date) : 'sem programação'}
        />

        <StatCard
          icon={MapPin}
          label="Território atual"
          value={
            next[0]?.territory_id
              ? terrs.get(next[0].territory_id) || '—'
              : '—'
          }
          hint={
            next[0]?.location_id
              ? locs.get(next[0].location_id) || ''
              : ''
          }
        />
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">PROGRAMAÇÃO</span>
            <h2>Próximos serviços</h2>
          </div>

          <button
            className="text-btn"
            type="button"
            onClick={() => setPage('field')}
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        <div className="schedule-list">
          {next.map((s) => {
            const wi = weekdayIndex(s)

            return (
              <div className="schedule-card" key={s.id}>
                <div className="date-pill">
                  <b>
                    {wi !== null
                      ? dayNames[wi].slice(0, 3).toUpperCase()
                      : 'DIA'}
                  </b>
                  <strong>{formatTime(scheduleTime(s))}</strong>
                </div>

                <div className="schedule-info">
                  <b>{locs.get(s.location_id) || 'Local não definido'}</b>
                  <span>
                    {formatDate(s._date)} · Dirigente:{' '}
                    {s.leader_id
                      ? leaders.get(s.leader_id) || '—'
                      : 'Não definido'}
                  </span>
                  <span>
                    Território:{' '}
                    {s.territory_id
                      ? terrs.get(s.territory_id) || '—'
                      : 'Não definido'}
                  </span>
                </div>

                <ArrowRight size={17} />
              </div>
            )
          })}

          {!next.length && (
            <div className="empty">Nenhum serviço programado.</div>
          )}
        </div>
      </section>

      <section
        className="attention"
        role="button"
        tabIndex={0}
        onClick={() => setPage('indications')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setPage('indications')
          }
        }}
      >
        <div className="attention-icon">
          <Sparkles size={20} />
        </div>

        <div>
          <b>Indicação inteligente</b>
          <span>
            {indications[0]
              ? `${indications[0].territory.name} precisa de atenção — ${indications[0].reason}.`
              : 'Cadastre territórios para começar.'}
          </span>
        </div>

        <ArrowRight size={18} />
      </section>
    </div>
  )
}
