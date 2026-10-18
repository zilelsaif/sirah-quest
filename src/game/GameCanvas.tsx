import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { createGame } from './bootstrap'
import { CLUE_DATA } from './clues/clueData'
import type { CluePanelData } from './clues/types'
import { createQuestionRun } from './questions/questionRun'
import type { QuestionRun } from './questions/types'
import { TestScene } from './scenes/TestScene'

const INITIAL_QUESTION_RUN = createQuestionRun(CLUE_DATA.length)

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [openClue, setOpenClue] = useState<CluePanelData | null>(null)
  const [questionRun, setQuestionRun] = useState<QuestionRun>(INITIAL_QUESTION_RUN)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = createGame(container, setOpenClue, questionRun.assignments)
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [questionRun])

  const getScene = () =>
    gameRef.current?.scene.getScene('movement-prototype') as TestScene | undefined

  const startNewTestRun = () => {
    setOpenClue(null)
    setQuestionRun(createQuestionRun(CLUE_DATA.length))
  }

  return (
    <div
      className="game-stage"
      data-question-ids={questionRun.assignments
        .map(({ question }) => question.id)
        .join(',')}
      data-selection-fallback={String(questionRun.usedFallback)}
    >
      {import.meta.env.DEV && (
        <div className="test-run-toolbar">
          <span>Development testing only</span>
          <button type="button" onClick={startNewTestRun}>
            New Test Run
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="game-canvas"
        aria-label="Sirah Quest exploration prototype"
        role="application"
      />
      {openClue && (
        <div className="clue-overlay" role="presentation">
          <section
            className="clue-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clue-title"
          >
            <p className="clue-panel__label">Sirah question · {openClue.title}</p>
            <h3 id="clue-title">{openClue.prompt.bm}</h3>
            <p className="clue-panel__translation" lang="en">
              {openClue.prompt.en}
            </p>

            <div className="clue-panel__options" aria-label="Answer choices">
              {openClue.options.map((option) => {
                const isCorrectReview =
                  openClue.state === 'completed' && option.id === openClue.correctOptionId

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={isCorrectReview ? 'is-correct' : undefined}
                    disabled={openClue.state === 'completed'}
                    aria-label={`${option.text.bm} / ${option.text.en}${
                      isCorrectReview ? ' — correct answer' : ''
                    }`}
                    onClick={() => getScene()?.answerClue(option.id)}
                  >
                    <span>{option.text.bm}</span>
                    <small lang="en">{option.text.en}</small>
                  </button>
                )
              })}
            </div>

            {openClue.feedback && (
              <div
                className={`clue-panel__feedback is-${openClue.feedback.tone}`}
                role="status"
                aria-live="polite"
              >
                <strong>{openClue.feedback.message.bm}</strong>
                <span lang="en">{openClue.feedback.message.en}</span>
              </div>
            )}

            {openClue.explanation && (
              <div className="clue-panel__explanation">
                <h4>Pelajaran / Learning note</h4>
                <p>{openClue.explanation.bm}</p>
                <p lang="en">{openClue.explanation.en}</p>
              </div>
            )}

            <p className="clue-panel__review-note">
              Content status: {openClue.reviewStatus.replaceAll('-', ' ')}
            </p>

            <div className="clue-panel__actions">
              <button type="button" onClick={() => getScene()?.closeClue()}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
