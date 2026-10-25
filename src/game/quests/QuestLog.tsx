import { WORLD_LOCATIONS } from '../../world/locationData'
import type { ClueSessionState } from '../session/types'
import { MAX_ACTIVE_QUESTS, QUEST_DATA } from './questData'
import { getQuestProgress } from './QuestManager'
import type { QuestDefinition, QuestSessionState, QuestStatus, QuestType } from './types'

interface QuestLogProps {
  session: QuestSessionState
  clues: Record<string, ClueSessionState>
  onAccept: (questId: string) => void
  onTrack: (questId: string | null) => void
  onClose: () => void
}

const TYPE_LABELS: Record<QuestType, string> = {
  main: 'Utama',
  side: 'Sampingan',
  repeatable: 'Boleh Diulang',
}

const STATUS_LABELS: Record<QuestStatus, string> = {
  LOCKED: 'Terkunci',
  AVAILABLE: 'Tersedia',
  ACTIVE: 'Aktif',
  COMPLETED: 'Selesai',
}

function QuestCard({
  quest,
  session,
  clues,
  onAccept,
  onTrack,
}: Omit<QuestLogProps, 'onClose'> & { quest: QuestDefinition }) {
  const state = session.quests[quest.id]
  const progress = getQuestProgress(quest, session)
  const isTracked = session.trackedQuestId === quest.id
  const relatedLocation = WORLD_LOCATIONS.find((location) => quest.areaIds.includes(location.areaId ?? ''))
  const activeCount = Object.values(session.quests).filter(
    (quest) => quest.status === 'ACTIVE',
  ).length
  const activeLimitReached = activeCount >= MAX_ACTIVE_QUESTS

  return (
    <article className={`quest-card is-${state.status.toLowerCase()}`}>
      <div className="quest-card__heading">
        <div>
          <span className="quest-card__type">{TYPE_LABELS[quest.type]}</span>
          <h4>{quest.titleBM}</h4>
        </div>
        {isTracked && <span className="quest-card__tracked">★ DIJEJAK</span>}
      </div>
      <p>{quest.descriptionBM}</p>
      <dl>
        <div><dt>Status</dt><dd>{STATUS_LABELS[state.status]}</dd></div>
        <div><dt>Lokasi</dt><dd>{relatedLocation?.nameBM ?? quest.areaIds[0]}</dd></div>
        <div><dt>Objektif</dt><dd>{progress.completed}/{progress.total}</dd></div>
      </dl>
      <ul className="quest-objectives">
        {quest.objectives.map((objective) => (
          <li key={objective.id} className={state.objectives[objective.id] ? 'is-complete' : ''}>
            {state.objectives[objective.id] ? '✓' : '○'} Selesaikan petunjuk berkaitan
            {clues[objective.relatedClueId]?.state === 'completed' && state.status === 'AVAILABLE'
              ? ' (telah ditemui)'
              : ''}
          </li>
        ))}
      </ul>
      <div className="quest-card__actions">
        {state.status === 'AVAILABLE' && (
          <button
            type="button"
            disabled={activeLimitReached}
            onClick={() => onAccept(quest.id)}
          >
            {activeLimitReached ? 'Had Quest Aktif Penuh' : 'Terima Quest'}
          </button>
        )}
        {state.status === 'ACTIVE' && !isTracked && (
          <button type="button" onClick={() => onTrack(quest.id)}>Jejaki Quest</button>
        )}
        {state.status === 'ACTIVE' && isTracked && (
          <button type="button" className="button-secondary" onClick={() => onTrack(null)}>
            Henti Jejak
          </button>
        )}
      </div>
    </article>
  )
}

export function QuestLog(props: QuestLogProps) {
  const sections: Array<{ status: QuestStatus; title: string }> = [
    { status: 'AVAILABLE', title: 'Quest Tersedia' },
    { status: 'ACTIVE', title: 'Quest Aktif' },
    { status: 'COMPLETED', title: 'Quest Selesai' },
  ]
  const trackedQuest = QUEST_DATA.find((quest) => quest.id === props.session.trackedQuestId)
  const activeCount = Object.values(props.session.quests).filter(
    (quest) => quest.status === 'ACTIVE',
  ).length

  return (
    <div className="quest-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section className="quest-log" role="dialog" aria-modal="true" aria-labelledby="quest-log-title">
        <header className="quest-log__header">
          <div>
            <p>Jurnal Pengembaraan</p>
            <h3 id="quest-log-title">Log Quest</h3>
          </div>
          <button type="button" className="button-secondary" onClick={props.onClose}>Tutup</button>
        </header>
        <p className="quest-log__summary">
          Quest aktif: {activeCount}/{MAX_ACTIVE_QUESTS}
          {trackedQuest ? ` · Dijejaki: ${trackedQuest.titleBM}` : ' · Tiada quest dijejaki'}
        </p>
        <div className="quest-log__sections">
          {sections.map((section) => {
            const quests = QUEST_DATA.filter(
              (quest) => props.session.quests[quest.id]?.status === section.status,
            )
            return (
              <section key={section.status} className="quest-section">
                <h4>{section.title} <span>{quests.length}</span></h4>
                {quests.length === 0 ? (
                  <p className="quest-section__empty">Tiada quest dalam bahagian ini.</p>
                ) : quests.map((quest) => <QuestCard key={quest.id} quest={quest} {...props} />)}
              </section>
            )
          })}
        </div>
      </section>
    </div>
  )
}

