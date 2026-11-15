import { useEffect, useRef, useState } from 'react'
import { TOPIC_LABELS } from '../mastery/masteryConfig'
import type { SirahMasteryState } from '../mastery/types'
import type { QuestionTopicId } from '../questions/types'
import { advanceReviewSession, answerReviewQuestion, createReviewSession, getEligibleReviewQuestions, type ReviewSession } from './reviewEngine'

const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function ReviewPanel({ mastery, onClose }: { mastery: SirahMasteryState; onClose: () => void }) {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const advancingRef = useRef(false)

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => { window.requestAnimationFrame(() => previousFocusRef.current?.isConnected && previousFocusRef.current.focus()) }
  }, [])

  const assignment = session && !session.complete ? session.assignments[session.index] : null
  const answered = session?.answeredOptionId !== null
  const correct = Boolean(assignment && session?.answeredOptionId === assignment.question.correctOptionId)
  const advance = () => {
    if (advancingRef.current) return
    advancingRef.current = true
    setSession((current) => current ? advanceReviewSession(current) : current)
    window.requestAnimationFrame(() => { advancingRef.current = false })
  }

  return <div className="review-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
    <section className="review-panel" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <header><div><p>LATIHAN SUKARELA</p><h2 id="review-title">Ulang Kaji</h2></div><button ref={closeRef} type="button" className="button-secondary" onClick={onClose}>Tutup</button></header>
      {!session && <><p>Pilih topik. Hanya soalan yang telah direkodkan selesai dalam permainan boleh diulang kaji.</p><div className="review-topic-grid">{TOPICS.map((topicId) => { const count = getEligibleReviewQuestions(mastery, topicId).length; return <button key={topicId} type="button" disabled={count === 0} onClick={() => setSession(createReviewSession(mastery, topicId))}><strong>{TOPIC_LABELS[topicId].bm}</strong><span>{count} soalan tersedia</span></button> })}</div></>}
      {assignment && session && <><p className="review-progress">Soalan {session.index + 1}/{session.assignments.length} · Skor sesi {session.correctCount}</p><h3>{assignment.question.prompt.bm}</h3><div className="review-options">{assignment.shuffledOptions.map((option) => <button key={option.id} type="button" disabled={answered} className={answered && option.id === assignment.question.correctOptionId ? 'is-correct' : answered && option.id === session.answeredOptionId ? 'is-incorrect' : undefined} onClick={() => setSession((current) => current ? answerReviewQuestion(current, option.id) : current)}>{option.text.bm}</button>)}</div>{answered && <div className={`review-feedback is-${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? 'Betul' : 'Belum Tepat'}</strong><p>{assignment.question.explanation.bm}</p><button type="button" onClick={advance}>{session.index === session.assignments.length - 1 ? 'Lihat Ringkasan' : 'Soalan Seterusnya'}</button></div>}</>}
      {session?.complete && <section className="review-summary"><h3>Ringkasan Sesi</h3><strong>{session.correctCount}/{session.assignments.length} jawapan betul</strong><p>Skor ini hanya untuk sesi ulang kaji dan tidak mengubah XP atau Penguasaan Sirah.</p><button type="button" onClick={() => setSession(null)}>Pilih Topik Lain</button></section>}
    </section>
  </div>
}
