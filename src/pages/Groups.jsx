import { UsersRound } from 'lucide-react'

const memberName = (member) => member?.name || member?.full_name || 'Sem nome'

export function Groups({ data }) {
  const groups = (data.groups || []).filter((g) => g.active)
  const members = data.members || []

  return (
    <div className="page">
      <div className="page-top">
        <div>
          <span className="eyebrow">COMUNIDADE</span>
          <h1>Grupos</h1>
          <p>Membros e dirigentes do serviço de campo.</p>
        </div>
        <div className="hero-icon"><UsersRound /></div>
      </div>

      <div className="group-grid">
        {groups.map((group) => {
          const groupMembers = members.filter(
            (member) => member.group_id === group.id && member.active
          )

          return (
            <section className="group-card" key={group.id}>
              <div className="group-head">
                <div className="avatar-stack">
                  {groupMembers.slice(0, 3).map((member) => (
                    <span key={member.id}>
                      {memberName(member).slice(0, 1).toUpperCase()}
                    </span>
                  ))}
                </div>

                <div>
                  <b>{group.name}</b>
                  <small>{groupMembers.length} membros</small>
                </div>
              </div>

              <div className="member-list">
                {groupMembers.map((member) => (
                  <div className="member-row" key={member.id}>
                    <div className="avatar">
                      {memberName(member).slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <b>{memberName(member)}</b>
                      <span>
                        {member.member_type === 'field_leader'
                          ? 'Dirigente de campo'
                          : 'Publicador'}
                      </span>
                    </div>
                  </div>
                ))}

                {!groupMembers.length && (
                  <div className="empty">
                    Nenhum membro ativo neste grupo.
                  </div>
                )}
              </div>
            </section>
          )
        })}

        {!groups.length && (
          <div className="empty">Nenhum grupo cadastrado.</div>
        )}
      </div>
    </div>
  )
}
