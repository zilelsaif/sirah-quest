import { getMasteryBand, getOverallMastery, getTopicMastery } from './SirahMastery'
import { TOPIC_LABELS } from './masteryConfig'
import type { SirahMasteryState } from './types'
import type { QuestionTopicId } from '../questions/types'

const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function SirahMasteryPanel({ state, onClose }: { state: SirahMasteryState; onClose: () => void }) {
  const overall = getOverallMastery(state)
  const overallBand = getMasteryBand(overall.percentage)
  return <div className="mastery-overlay" role="presentation">
    <section className="mastery-panel" role="dialog" aria-modal="true" aria-labelledby="mastery-title">
      <header><div><p className="mastery-panel__eyebrow">Kemajuan pembelajaran</p><h2 id="mastery-title">PENGUASAAN SIRAH</h2></div><button type="button" onClick={onClose}>Tutup</button></header>
      <section className="mastery-overall"><strong>{overall.percentage}%</strong><div><span>{overallBand.labelBM}</span><small>Keseluruhan · Liputan {overall.covered} / {overall.total} soalan</small></div></section>
      <div className="mastery-topics">{TOPICS.map((topicId) => {
        const summary = getTopicMastery(state, topicId); const band = getMasteryBand(summary.percentage); const label = TOPIC_LABELS[topicId]
        return <article className="mastery-card" key={topicId}><h3>{label.bm}</h3><small lang="en">{label.en}</small><strong>{summary.percentage}%</strong><span>{band.labelBM}</span><div className="mastery-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.percentage}><i style={{width:`${summary.percentage}%`}} /></div><p>{summary.earned} / {summary.possible} mata penguasaan</p><p>Liputan: {summary.covered} / {summary.total} soalan</p></article>
      })}</div>
      <p className="mastery-panel__note">Penguasaan ialah kemajuan pembelajaran dalam permainan, bukan pensijilan agama atau sejarah.</p>
    </section>
  </div>
}
