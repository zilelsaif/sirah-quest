import { useEffect, useRef, useState } from 'react'
import { TOPIC_LABELS } from '../mastery/masteryConfig'
import type { QuestionReviewStatus, QuestionTopicId } from '../questions/types'
import type { JournalModel } from './types'

type JournalTab = 'quests' | 'knowledge' | 'exploration' | 'mastery'

const TABS: Array<{ id: JournalTab; label: string }> = [
  { id: 'quests', label: 'Kronik Misi' },
  { id: 'knowledge', label: 'Jurnal Ilmu' },
  { id: 'exploration', label: 'Rekod Penjelajahan' },
  { id: 'mastery', label: 'Sirah Mastery' },
]

const QUEST_TYPE = { main: 'Utama', side: 'Sampingan', repeatable: 'Boleh Diulang' }
const REVIEW_STATUS: Record<QuestionReviewStatus, string> = {
  'pending-editorial-review': 'Menunggu semakan editorial',
  approved: 'Diluluskan secara editorial',
  'needs-revision': 'Memerlukan semakan semula',
}
const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function JournalPanel({ model, onOpenReview, onClose }: { model: JournalModel; onOpenReview: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<JournalTab>('quests')
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.requestAnimationFrame(() => previousFocusRef.current?.isConnected && previousFocusRef.current.focus())
    }
  }, [onClose])

  return (
    <div className="journal-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section className="journal-panel" role="dialog" aria-modal="true" aria-labelledby="journal-title">
        <header>
          <div><p>REKOD PENGEMBARAAN</p><h2 id="journal-title">Jurnal Pengembara</h2></div>
          <button ref={closeRef} type="button" className="button-secondary" onClick={onClose}>Tutup</button>
        </header>
        <nav className="journal-tabs" aria-label="Bahagian jurnal">
          {TABS.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
        </nav>
        <div className="journal-content" tabIndex={0}>
          {tab === 'quests' && <section aria-labelledby="journal-quests"><h3 id="journal-quests">Kronik Misi</h3>
            {model.quests.length === 0 ? <p className="journal-empty">Belum ada misi aktif atau selesai.</p> : <div className="journal-grid">{model.quests.map((quest) => <article className="journal-card" key={quest.id}>
              <div className="journal-card__heading"><span>{QUEST_TYPE[quest.type]} · {quest.status === 'ACTIVE' ? 'Aktif' : 'Selesai'}</span>{quest.tracked && <strong>★ DIJEJAK</strong>}</div>
              <h4>{quest.titleBM}</h4><p>Lokasi: {quest.areaBM}</p><p>Objektif: {quest.completedObjectives}/{quest.totalObjectives}</p>
              <ul>{quest.objectives.map((objective) => <li key={objective.id}>{objective.completed ? '✓ Selesai' : '○ Belum selesai'}</li>)}</ul>
            </article>)}</div>}
          </section>}
          {tab === 'knowledge' && <section aria-labelledby="journal-knowledge"><h3 id="journal-knowledge">Jurnal Ilmu</h3>
            <p className="journal-note">Catatan ilmu daripada petunjuk selesai. Kandungan berstatus semakan editorial bukan pengesahan agama atau sejarah.</p>
            <p className="journal-note">Catatan lama mungkin tidak mempunyai rekod skor Penguasaan yang sepadan.</p>
            <button type="button" className="journal-review-button" onClick={onOpenReview}>Ulang Kaji</button>
            {TOPICS.map((topicId) => { const entries = model.knowledge.filter((entry) => entry.topicId === topicId); return <section className="journal-topic" key={topicId}><h4>{TOPIC_LABELS[topicId].bm} <span>{entries.length}</span></h4>{entries.length === 0 ? <p className="journal-empty">Belum ada catatan ilmu yang lengkap.</p> : entries.map((entry) => <article className="journal-card" key={entry.questionId}><span className="journal-id">{entry.questionId}</span><h5>{entry.promptBM}</h5><p><strong>Jawapan:</strong> {entry.answerBM}</p><p>{entry.explanationBM}</p><p className="journal-meta">{entry.areaBM} · {entry.clueTitle} · {REVIEW_STATUS[entry.reviewStatus]}</p></article>)}</section> })}
            {model.legacyKnowledge.length > 0 && <section className="journal-topic"><h4>Rekod simpanan lama</h4>{model.legacyKnowledge.map((entry) => <p className="journal-empty" key={entry.clueId}>Petunjuk selesai di {entry.areaBM} ({entry.clueTitle}), tetapi simpanan ini tidak mempunyai bukti mencukupi untuk mengenal pasti soalan asal.</p>)}</section>}
          </section>}
          {tab === 'exploration' && <section aria-labelledby="journal-exploration"><h3 id="journal-exploration">Rekod Penjelajahan</h3><div className="journal-grid">{model.exploration.map((area) => <article className="journal-card" key={area.areaId}><div className="journal-card__heading"><span>{area.visited ? 'Telah dilawati' : 'Belum dilawati'}</span>{area.current && <strong>LOKASI SEMASA</strong>}</div><h4>{area.nameBM}</h4><p>Petunjuk ditemui: {area.discoveredClues}/{area.totalClues}</p><p>Petunjuk selesai: {area.completedClues}/{area.totalClues}</p></article>)}</div><section className="journal-landmarks" aria-labelledby="journal-landmarks"><h4 id="journal-landmarks">Penemuan Mercu Tanda · {model.landmarkDiscoveries.discovered}/{model.landmarkDiscoveries.total}</h4><div className="journal-grid">{model.landmarkDiscoveries.areas.map((area) => <article className="journal-card" key={area.areaId}><h5>{area.nameBM} · {area.discovered}/{area.total}</h5><ul>{area.landmarks.map((landmark) => <li key={landmark.id} className={landmark.discovered ? 'is-discovered' : undefined}><strong>{landmark.nameBM}</strong><p>{landmark.descriptionBM}</p></li>)}</ul></article>)}</div></section></section>}
          {tab === 'mastery' && <section aria-labelledby="journal-mastery"><h3 id="journal-mastery">Sirah Mastery</h3><p className="journal-note">Liputan berdasarkan rekod skor terbaik. Catatan lama mungkin tidak mempunyai skor Penguasaan yang tersimpan.</p><div className="journal-grid">{model.mastery.map((summary) => <article className="journal-card" key={summary.topicId}><h4>{TOPIC_LABELS[summary.topicId].bm}</h4>{summary.covered === 0 ? <p className="journal-empty">Belum ada data penguasaan.</p> : <><strong className="journal-score">{summary.percentage}%</strong><p>{summary.earned}/{summary.possible} mata · Liputan {summary.covered}/{summary.total}</p></>}</article>)}</div></section>}
        </div>
      </section>
    </div>
  )
}
