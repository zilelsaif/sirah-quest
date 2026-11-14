import { useEffect, useRef } from 'react'
import type { WorldObjectPanelData } from './types'
import type { QuestSessionState } from '../quests/types'

interface WorldObjectPanelProps {
  object: WorldObjectPanelData
  onClose: () => void
  quests: QuestSessionState
}

export function WorldObjectPanel({ object, quests, onClose }: WorldObjectPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const activeContext = object.questContexts?.find(({ questId }) => quests.quests[questId]?.status === 'ACTIVE')

  return (
    <div className="world-object-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section className="world-object-panel" role="dialog" aria-modal="true" aria-labelledby="world-object-title">
        <p className="world-object-panel__label">Interaksi Dunia</p>
        <h3 id="world-object-title">{object.nameBM}</h3>
        <p>{object.descriptionBM}</p>
        {activeContext && <p className="world-object-panel__quest-context">Konteks misi: {activeContext.textBM}</p>}
        <button ref={closeButtonRef} type="button" onClick={onClose}>Tutup</button>
      </section>
    </div>
  )
}
