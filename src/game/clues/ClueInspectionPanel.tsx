import { useEffect, useRef } from 'react'
import type { ClueInspectionData } from './types'

interface ClueInspectionPanelProps {
  clue: ClueInspectionData
  onContinue: () => void
  onClose: () => void
}

export function ClueInspectionPanel({ clue, onContinue, onClose }: ClueInspectionPanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
  }, [clue.id])

  return (
    <section
      ref={panelRef}
      className="clue-inspection-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clue-inspection-title"
      tabIndex={-1}
    >
      {clue.assetUrl && <img src={clue.assetUrl} alt="" aria-hidden="true" />}
      <div className="clue-inspection-panel__content">
        <p>OBJEK PEMBELAJARAN</p>
        <h3 id="clue-inspection-title">{clue.physicalName.bm}</h3>
        <p>{clue.inspect.bm}</p>
        <details>
          <summary>English</summary>
          <strong lang="en">{clue.physicalName.en}</strong>
          <p lang="en">{clue.inspect.en}</p>
        </details>
        <small>Prop pembelajaran rekaan · Prototype visual QA pending</small>
      </div>
      <div className="clue-inspection-panel__actions">
        <button type="button" onClick={onContinue}>
          {clue.state === 'completed' ? 'Semak Semula / Review' : 'Baca Soalan / Read Question'}
        </button>
        <button type="button" className="button-secondary" onClick={onClose} aria-label="Tutup pemeriksaan petunjuk">
          Tutup
        </button>
      </div>
    </section>
  )
}
