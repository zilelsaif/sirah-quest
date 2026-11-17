import { useEffect, useRef, useState } from 'react'
import type { NpcDefinition } from '../npcs/types'
import { getDialogueNode, getVisibleDialogueChoices } from './DialogueEngine'
import { QUEST_DATA } from '../quests/questData'
import type { QuestSessionState } from '../quests/types'
import type { DialogueActionFeedback, DialogueSession } from './types'
import keeperPortraitSheet from '../../assets/characters/npc-hall-keeper-n07c.png'

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
  const [expanded, setExpanded] = useState(Boolean(quest))
  const [selectedChoiceId, setSelectedChoiceId] = useState('')
  const usesChoiceMenu = choices.length > 4
  const hasApprovedPortrait = npc.id === 'npc-penjaga-balai-ilmu'

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('.dialogue-panel__content')?.scrollTo(0, 0)
    setExpanded(Boolean(quest))
    setSelectedChoiceId('')
    panelRef.current?.querySelector<HTMLButtonElement>('[data-dialogue-primary]')?.focus({ preventScroll: true })
  }, [node.id])

  return (
    <div className="dialogue-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section
        ref={panelRef}
        className={`dialogue-panel${expanded ? ' dialogue-panel--expanded' : ''}${hasApprovedPortrait ? ' has-portrait' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogue-npc-name"
      >
        {hasApprovedPortrait && <div
          className="dialogue-panel__portrait"
          aria-hidden="true"
          style={{ backgroundImage: `url(${keeperPortraitSheet})` }}
        />}
        <header>
          <h3 id="dialogue-npc-name">{npc.nameBM}</h3>
          <div className="dialogue-panel__header-actions">
            <button
              type="button"
              className="dialogue-panel__icon-button"
              aria-expanded={expanded}
              aria-label={expanded ? 'Kecilkan dialog' : 'Besarkan dialog'}
              title={expanded ? 'Kecilkan' : 'Besarkan'}
              onClick={() => setExpanded((current) => !current)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{expanded ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /> : <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />}</svg>
            </button>
            <button type="button" className="dialogue-panel__icon-button" aria-label="Tutup dialog" title="Tutup" onClick={onClose}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
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

          {usesChoiceMenu && (
          <div className="dialogue-panel__choice-menu">
            <label>
              <span>Pilih misi</span>
              <select value={selectedChoiceId} onChange={(event) => setSelectedChoiceId(event.target.value)}>
                <option value="">Pilih pilihan…</option>
                {choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.text.bm} — {choice.text.en}</option>)}
              </select>
            </label>
            <button type="button" disabled={!selectedChoiceId} onClick={() => { onChoose(selectedChoiceId); setSelectedChoiceId('') }}>Pilih</button>
          </div>
          )}

          {choices.length > 0 && !usesChoiceMenu && (
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
          <button type="button" data-dialogue-primary className="dialogue-panel__continue" aria-label={node.nextNodeId ? 'Teruskan' : 'Tamat Perbualan'} title={node.nextNodeId ? 'Teruskan' : 'Tamat Perbualan'} onClick={onAdvance}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        )}
      </section>
    </div>
  )
}
