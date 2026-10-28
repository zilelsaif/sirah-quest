import { useEffect, useRef } from 'react'
import type { NpcDefinition } from '../npcs/types'
import { getDialogueNode } from './DialogueEngine'
import type { DialogueSession } from './types'

interface DialoguePanelProps {
  npc: NpcDefinition
  session: DialogueSession
  onAdvance: () => void
  onChoose: (choiceId: string) => void
  onClose: () => void
}

export function DialoguePanel({ npc, session, onAdvance, onChoose, onClose }: DialoguePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const node = getDialogueNode(session)
  const choices = node.choices ?? []

  useEffect(() => {
    panelRef.current?.querySelector<HTMLButtonElement>('[data-dialogue-primary]')?.focus()
  }, [node.id])

  return (
    <div className="dialogue-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section
        ref={panelRef}
        className="dialogue-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogue-npc-name"
      >
        <header>
          <div>
            <p>PERBUALAN</p>
            <h3 id="dialogue-npc-name">{npc.nameBM}</h3>
            <span>{npc.roleBM}</span>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Tutup</button>
        </header>

        <p className="dialogue-panel__text">{node.text.bm}</p>

        {choices.length > 0 ? (
          <div className="dialogue-panel__choices" aria-label="Pilihan jawapan">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                data-dialogue-primary={index === 0 ? '' : undefined}
                onClick={() => onChoose(choice.id)}
              >
                {choice.text.bm}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" data-dialogue-primary className="dialogue-panel__continue" onClick={onAdvance}>
            {node.nextNodeId ? 'Teruskan' : 'Tamat Perbualan'}
          </button>
        )}
      </section>
    </div>
  )
}
