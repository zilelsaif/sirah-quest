import type Phaser from 'phaser'
import clue01Url from '../../assets/clues/kampung-ilmu/ki-c01-kitab-permulaan.png'
import clue02Url from '../../assets/clues/kampung-ilmu/ki-c02-gulungan-catatan-wahyu.png'
import clue03Url from '../../assets/clues/kampung-ilmu/ki-c03-peta-perjalanan.png'
import clue04Url from '../../assets/clues/kampung-ilmu/ki-c04-buku-catatan-kampung.png'
import clue05Url from '../../assets/clues/kampung-ilmu/ki-c05-himpunan-lembaran-ilmu.png'
import clue06Url from '../../assets/clues/kampung-ilmu/ki-c06-buku-nota-balai.png'
import clue07Url from '../../assets/clues/kampung-ilmu/ki-c07-bekas-manuskrip.png'
import type { BilingualText } from '../questions/types'

export type KampungPhysicalClueId =
  | 'clue-1'
  | 'clue-2'
  | 'clue-3'
  | 'pack1-kampung-catatan-awal'
  | 'pack1-kampung-lembaran-ilmu'
  | 'pack2-kampung-nota-balai'
  | 'pack2-kampung-jejak-lembaran'

export interface KampungClueVisualMetadata {
  assetId: `KI-C0${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  textureKey: string
  assetUrl: string
  name: BilingualText
  inspect: BilingualText
  origin: readonly [number, number]
  scale: number
  alphaBounds: Readonly<{ x: number; y: number; width: number; height: number }>
  status: 'PROTOTYPE_VISUAL_QA_PENDING'
}

const metadata = (
  assetId: KampungClueVisualMetadata['assetId'],
  assetUrl: string,
  name: BilingualText,
  inspect: BilingualText,
  alphaY: number,
): KampungClueVisualMetadata => ({
  assetId,
  textureKey: `kampung-physical-clue-${assetId.toLowerCase()}`,
  assetUrl,
  name,
  inspect,
  origin: [0.5, 0.90625],
  scale: 0.22,
  alphaBounds: { x: 16, y: alphaY, width: 224, height: 232 - alphaY },
  status: 'PROTOTYPE_VISUAL_QA_PENDING',
})

export const KAMPUNG_CLUE_VISUALS = {
  'clue-1': metadata('KI-C01', clue01Url,
    { bm: 'Kitab Permulaan', en: 'Book of Beginnings' },
    {
      bm: 'Kitab ini menghimpunkan bahan pembelajaran tentang kehidupan awal Nabi Muhammad ﷺ. Bacalah untuk menguji pengetahuanmu.',
      en: 'This book brings together learning material about the early life of Prophet Muhammad ﷺ. Read it to test your knowledge.',
    }, 51),
  'clue-2': metadata('KI-C02', clue02Url,
    { bm: 'Gulungan Catatan Wahyu', en: 'Scroll of Revelation Notes' },
    {
      bm: 'Gulungan ini mengandungi catatan pembelajaran tentang peristiwa wahyu pertama. Teliti catatan sebelum menjawab soalan.',
      en: 'This scroll contains learning notes about the first revelation. Examine the notes before answering the question.',
    }, 85),
  'clue-3': metadata('KI-C03', clue03Url,
    { bm: 'Peta Perjalanan', en: 'Journey Map' },
    {
      bm: 'Peta rekaan ini menjadi panduan untuk mempelajari perjalanan Hijrah ke Madinah. Mari semak pengetahuanmu tentang Hijrah.',
      en: 'This fictional map serves as a guide to learning about the Hijrah journey to Madinah. Let us review your knowledge of the Hijrah.',
    }, 60),
  'pack1-kampung-catatan-awal': metadata('KI-C04', clue04Url,
    { bm: 'Buku Catatan Kampung', en: 'Village Journal' },
    {
      bm: 'Kamu menemui buku catatan pembelajaran tentang kehidupan awal Baginda. Semak catatan ini untuk meneruskan misimu.',
      en: 'You have found a journal of learning notes about the Prophet’s early life. Review these notes to continue your mission.',
    }, 28),
  'pack1-kampung-lembaran-ilmu': metadata('KI-C05', clue05Url,
    { bm: 'Himpunan Lembaran Ilmu', en: 'Collection of Learning Pages' },
    {
      bm: 'Lembaran yang disusun ini mengandungi bahan pembelajaran tentang wahyu pertama. Periksa himpunan ini sebelum meneruskan pencarian.',
      en: 'These collected pages contain learning material about the first revelation. Examine them before continuing your search.',
    }, 56),
  'pack2-kampung-nota-balai': metadata('KI-C06', clue06Url,
    { bm: 'Buku Nota Balai', en: 'Hall Notebook' },
    {
      bm: 'Buku nota ini menyimpan bahan ulang kaji tentang kehidupan awal Nabi Muhammad ﷺ. Uji pengetahuanmu melalui soalan yang disediakan.',
      en: 'This notebook contains revision material about the early life of Prophet Muhammad ﷺ. Test your knowledge with the prepared question.',
    }, 42),
  'pack2-kampung-jejak-lembaran': metadata('KI-C07', clue07Url,
    { bm: 'Bekas Manuskrip', en: 'Manuscript Box' },
    {
      bm: 'Bekas ini menyimpan lembaran pembelajaran rekaan tentang wahyu pertama. Semak satu petunjuk sebelum meneruskan perjalanan.',
      en: 'This box holds fictional learning pages about the first revelation. Review a clue before continuing your journey.',
    }, 39),
} satisfies Record<KampungPhysicalClueId, KampungClueVisualMetadata>

export function getKampungClueVisual(clueId: string) {
  return KAMPUNG_CLUE_VISUALS[clueId as KampungPhysicalClueId]
}

export function preloadKampungClueVisuals(scene: Phaser.Scene) {
  Object.values(KAMPUNG_CLUE_VISUALS).forEach(({ textureKey, assetUrl }) => {
    if (!scene.textures.exists(textureKey)) scene.load.image(textureKey, assetUrl)
  })
}
