export const QUESTION_MASTERY_MAX = 10
export const MASTERY_BASE_CORRECT = 6
export const MASTERY_FIRST_ATTEMPT_BONUS = 2
export const MASTERY_NO_HINT_BONUS = 2

export const MASTERY_BANDS = [
  { min: 90, labelBM: 'CEMERLANG', labelEN: 'EXCELLENT' },
  { min: 75, labelBM: 'KUKUH', labelEN: 'STRONG' },
  { min: 50, labelBM: 'BERKEMBANG', labelEN: 'DEVELOPING' },
  { min: 25, labelBM: 'MEMBINA ASAS', labelEN: 'BUILDING FOUNDATIONS' },
  { min: 0, labelBM: 'PERMULAAN', labelEN: 'BEGINNING' },
] as const

export const TOPIC_LABELS = {
  'early-life': { bm: 'Kehidupan Awal', en: 'Early Life' },
  'first-revelation': { bm: 'Wahyu Pertama', en: 'First Revelation' },
  hijrah: { bm: 'Hijrah', en: 'Hijrah' },
} as const

