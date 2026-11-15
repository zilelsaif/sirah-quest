import { getMasteryBand, getOverallMastery, getTopicMastery } from './SirahMastery'
import { TOPIC_LABELS } from './masteryConfig'
import type { SirahMasteryState } from './types'
import type { QuestionTopicId } from '../questions/types'
import type { AreaSessionState } from '../session/types'
import { ALL_AREA_CLUES } from '../areas/areaRegistry'
import { getAllClueStates } from '../session/createSession'

const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function SirahMasteryPanel({ state, session, onClose }: { state: SirahMasteryState; session: AreaSessionState; onClose: () => void }) {
  const overall = getOverallMastery(state)
  const overallBand = getMasteryBand(overall.percentage)
  return <div className="mastery-overlay" role="presentation">
    <section className="mastery-panel" role="dialog" aria-modal="true" aria-labelledby="mastery-title">
      <header><div><p className="mastery-panel__eyebrow">Kemajuan pembelajaran</p><h2 id="mastery-title">PENGUASAAN SIRAH</h2></div><button type="button" onClick={onClose}>Tutup</button></header>
      <section className="mastery-overall"><strong>{overall.percentage}%</strong><div><span>{overallBand.labelBM}</span><small>Keseluruhan · Liputan {overall.covered} / {overall.total} soalan</small></div></section>
      <div className="mastery-topics">{TOPICS.map((topicId) => {
        const summary = getTopicMastery(state, topicId); const band = getMasteryBand(summary.percentage); const label = TOPIC_LABELS[topicId]
        const topicClues = ALL_AREA_CLUES.filter((clue) => clue.questionTopicId === topicId)
        const clueStates = getAllClueStates(session)
        const completedClues = topicClues.filter((clue) => clueStates[clue.id]?.state === 'completed').length
        return <article className="mastery-card" key={topicId}><h3>{label.bm}</h3><small lang="en">{label.en}</small><strong>{summary.percentage}%</strong><span>{band.labelBM}</span><div className="mastery-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.percentage}><i style={{width:`${summary.percentage}%`}} /></div><p>Petunjuk selesai: {completedClues} / {topicClues.length}</p><p>Soalan dengan rekod skor terbaik: {summary.covered} / {summary.total}</p><p>Mata terbaik: {summary.earned} / {summary.possible}</p></article>
      })}</div>
      <p className="mastery-panel__note">Petunjuk selesai, soalan dengan rekod skor terbaik dan mata Penguasaan ialah ukuran berbeza. Cubaan yang belum diselesaikan tidak disimpan sebagai metrik. Ulang Kaji tidak mengubah rekod ini. Penguasaan permainan bukan pensijilan editorial, agama atau sejarah.</p>
    </section>
  </div>
}
