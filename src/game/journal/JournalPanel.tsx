import { useEffect, useRef, useState } from 'react'
import { TOPIC_LABELS } from '../mastery/masteryConfig'
import type { QuestionTopicId } from '../questions/types'
import type { JournalModel } from './types'

type JournalTab = 'quests' | 'knowledge' | 'exploration' | 'mastery'

const TABS: Array<{ id: JournalTab; label: string }> = [
  { id: 'quests', label: 'Kronik Misi' },
  { id: 'knowledge', label: 'Jurnal Ilmu' },
  { id: 'exploration', label: 'Rekod Penjelajahan' },
  { id: 'mastery', label: 'Sirah Mastery' },
]

const QUEST_TYPE = { main: 'Utama', side: 'Sampingan', repeatable: 'Boleh Diulang' }
const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function JournalPanel({ model, onClose }: { model: JournalModel; onClose: () => void }) {
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
              <h4>{quest.titleBM}</h4><small lang="en">{quest.titleEN}</small><p>Lokasi: {quest.areaBM}</p><p>Objektif: {quest.completedObjectives}/{quest.totalObjectives}</p>
              <ul>{quest.objectives.map((objective) => <li key={objective.id}>{objective.completed ? '✓ Selesai' : '○ Belum selesai'}</li>)}</ul>
            </article>)}</div>}
          </section>}
          {tab === 'knowledge' && <section aria-labelledby="journal-knowledge"><h3 id="journal-knowledge">Jurnal Ilmu</h3>
            <p className="journal-note">Hanya jawapan yang benar-benar telah diselesaikan dipaparkan. Kandungan berstatus semakan editorial bukan pengesahan agama atau sejarah.</p>
            {TOPICS.map((topicId) => { const entries = model.knowledge.filter((entry) => entry.topicId === topicId); return <section className="journal-topic" key={topicId}><h4>{TOPIC_LABELS[topicId].bm} <span>{entries.length}</span></h4>{entries.length === 0 ? <p className="journal-empty">Belum ada catatan ilmu yang lengkap.</p> : entries.map((entry) => <article className="journal-card" key={entry.questionId}><span className="journal-id">{entry.questionId}</span><h5>{entry.promptBM}</h5><small lang="en">{entry.promptEN}</small><p><strong>Jawapan:</strong> {entry.answerBM}</p><small lang="en">{entry.answerEN}</small><p>{entry.explanationBM}</p><small lang="en">{entry.explanationEN}</small><p className="journal-meta">{entry.areaBM} · {entry.clueTitle} · {entry.reviewStatus.replaceAll('-', ' ')}</p></article>)}</section> })}
            {model.legacyKnowledge.length > 0 && <section className="journal-topic"><h4>Rekod simpanan lama</h4>{model.legacyKnowledge.map((entry) => <p className="journal-empty" key={entry.clueId}>Petunjuk selesai di {entry.areaBM} ({entry.clueTitle}), tetapi simpanan ini tidak mempunyai bukti mencukupi untuk mengenal pasti soalan asal.</p>)}</section>}
          </section>}
          {tab === 'exploration' && <section aria-labelledby="journal-exploration"><h3 id="journal-exploration">Rekod Penjelajahan</h3><div className="journal-grid">{model.exploration.map((area) => <article className="journal-card" key={area.areaId}><div className="journal-card__heading"><span>{area.visited ? 'Telah dilawati' : 'Belum dilawati'}</span>{area.current && <strong>LOKASI SEMASA</strong>}</div><h4>{area.nameBM}</h4><small lang="en">{area.nameEN}</small><p>Petunjuk ditemui: {area.discoveredClues}/{area.totalClues}</p><p>Petunjuk selesai: {area.completedClues}/{area.totalClues}</p></article>)}</div></section>}
          {tab === 'mastery' && <section aria-labelledby="journal-mastery"><h3 id="journal-mastery">Sirah Mastery</h3><p className="journal-note">Paparan baca sahaja daripada rekod Penguasaan Sirah sedia ada.</p><div className="journal-grid">{model.mastery.map((summary) => <article className="journal-card" key={summary.topicId}><h4>{TOPIC_LABELS[summary.topicId].bm}</h4><small lang="en">{TOPIC_LABELS[summary.topicId].en}</small>{summary.covered === 0 ? <p className="journal-empty">Belum ada data penguasaan.</p> : <><strong className="journal-score">{summary.percentage}%</strong><p>{summary.earned}/{summary.possible} mata · Liputan {summary.covered}/{summary.total}</p></>}</article>)}</div></section>}
        </div>
      </section>
    </div>
  )
}
