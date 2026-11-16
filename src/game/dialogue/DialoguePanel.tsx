import { useEffect, useRef, useState } from 'react'
import type { NpcDefinition } from '../npcs/types'
import { getDialogueNode, getVisibleDialogueChoices } from './DialogueEngine'
import { QUEST_DATA } from '../quests/questData'
import type { QuestSessionState } from '../quests/types'
import type { DialogueActionFeedback, DialogueSession } from './types'

interface DialoguePanelProps {
  npc: NpcDefinition
  session: DialogueSession
  questSession: QuestSessionState
  feedback: DialogueActionFeedback | null
  onAdvance: () => void
  onChoose: (choiceId: string) => void
  onClose: () => void
}

export function DialoguePanel({ npc, session, questSession, feedback, onAdvance, onChoose, onClose }: DialoguePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const node = getDialogueNode(session)
  const choices = getVisibleDialogueChoices(session, { quests: questSession })
  const quest = node.questId ? QUEST_DATA.find((candidate) => candidate.id === node.questId) : undefined
  const [expanded, setExpanded] = useState(Boolean(quest) || choices.length > 4)

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('.dialogue-panel__content')?.scrollTo(0, 0)
    setExpanded(Boolean(quest) || choices.length > 4)
    panelRef.current?.querySelector<HTMLButtonElement>('[data-dialogue-primary]')?.focus({ preventScroll: true })
  }, [node.id])

  return (
    <div className="dialogue-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section
        ref={panelRef}
        className={`dialogue-panel${expanded ? ' dialogue-panel--expanded' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogue-npc-name"
      >
        <header>
          <div>
            <p>{node.id.startsWith('n07d-') ? 'PROTOTYPE · SEMAKAN NARATIF' : 'PERBUALAN'}</p>
            <h3 id="dialogue-npc-name">{npc.nameBM}</h3>
            <span>{npc.roleBM}</span>
          </div>
          <div className="dialogue-panel__header-actions">
            <button
              type="button"
              className="button-secondary"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? 'Kecilkan' : 'Besarkan'}
            </button>
            <button type="button" className="button-secondary" onClick={onClose}>Tutup</button>
          </div>
        </header>

        <div className="dialogue-panel__content">
          <div className="dialogue-panel__copy">
            <p className="dialogue-panel__text">{node.text.bm}</p>
            <small lang="en">{node.text.en}</small>
          </div>

          {quest && (
          <section className="dialogue-panel__quest" aria-label="Maklumat misi">
            <span>{quest.type === 'main' ? 'Misi Utama' : 'Misi Sampingan'}</span>
            <h4>{quest.titleBM}</h4>
            <p>{quest.descriptionBM}</p>
            <small lang="en">{quest.titleEN} · {quest.descriptionEN}</small>
          </section>
          )}

          {feedback && (
          <div className={`dialogue-panel__feedback is-${feedback.tone}`} role="status" aria-live="polite">
            <strong>{feedback.message.bm}</strong>
            <small lang="en">{feedback.message.en}</small>
          </div>
          )}

          {choices.length > 0 && (
          <div className="dialogue-panel__choices" aria-label="Pilihan jawapan">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                data-dialogue-primary={index === 0 ? '' : undefined}
                onClick={() => onChoose(choice.id)}
              >
                <span>{choice.text.bm}</span>
                <small lang="en">{choice.text.en}</small>
              </button>
            ))}
          </div>
          )}
        </div>

        {choices.length === 0 && (
          <button type="button" data-dialogue-primary className="dialogue-panel__continue" onClick={onAdvance}>
            {node.nextNodeId ? 'Teruskan' : 'Tamat Perbualan'}
          </button>
        )}
      </section>
    </div>
  )
}
