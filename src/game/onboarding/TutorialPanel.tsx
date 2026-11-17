import { useEffect, useRef } from 'react'
import { getActiveTutorialStep, TUTORIAL_STEPS, type TutorialState } from './tutorialController'

interface TutorialPanelProps {
  state: TutorialState
  open: boolean
  onStart: () => void
  onSkip: () => void
  onClose: () => void
  onOpen: () => void
  showHelpTrigger?: boolean
}

export function TutorialPanel({ state, open, onStart, onSkip, onClose, onOpen, showHelpTrigger = true }: TutorialPanelProps) {
  const helpRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) helpRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return showHelpTrigger
    ? <button ref={helpRef} type="button" className="tutorial-help-button" onClick={onOpen}>Panduan</button>
    : null

  const step = getActiveTutorialStep(state)
  const stepNumber = TUTORIAL_STEPS.findIndex((candidate) => candidate.id === step.id) + 1
  return (
    <aside className="tutorial-panel" aria-labelledby="tutorial-title" aria-live="polite">
      <header>
        <div>
          <p>PANDUAN PENGEMBARA</p>
          <h2 id="tutorial-title">
            {state.status === 'NOT_STARTED' ? 'Pengembaraan Pertama' : state.status === 'COMPLETED' ? 'Panduan Selesai' : step.title.bm}
          </h2>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Tutup</button>
      </header>
      {state.status === 'NOT_STARTED' ? (
        <p>Ikuti lima panduan ringkas sambil bermain. Panduan ini pilihan dan tidak mengubah kemajuan permainan.</p>
      ) : state.status === 'COMPLETED' ? (
        <p>Anda telah mencuba pergerakan, NPC, misi, penerokaan dan Jurnal Pengembara.</p>
      ) : (
        <>
          <p className="tutorial-panel__progress">Langkah {stepNumber} / {TUTORIAL_STEPS.length}</p>
          <p>{step.instruction.bm}</p>
        </>
      )}
      <div className="tutorial-panel__actions">
        {state.status === 'NOT_STARTED' && <button type="button" onClick={onStart}>Seterusnya</button>}
        {state.status !== 'COMPLETED' && <button type="button" className="button-secondary" onClick={onSkip}>Langkau Panduan</button>}
      </div>
    </aside>
  )
}
