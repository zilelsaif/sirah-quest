import { QUEST_DATA } from '../quests/questData'
import type { DialogueChoice, DialogueDefinition, DialogueNode } from './types'

function questChoiceSet(questId: string): DialogueChoice[] {
  const quest = QUEST_DATA.find((candidate) => candidate.id === questId)
  if (!quest) throw new Error(`Unknown NPC quest association: ${questId}`)
  const label = { bm: quest.titleBM, en: quest.titleEN }
  return [
    { id: `${questId}-available`, text: label, nextNodeId: `${questId}-offer`, condition: { type: 'QUEST_STATUS', questId, status: 'AVAILABLE' } },
    { id: `${questId}-active`, text: { bm: `${quest.titleBM} · Sedang aktif`, en: `${quest.titleEN} · Active` }, nextNodeId: `${questId}-active-node`, condition: { type: 'QUEST_STATUS', questId, status: 'ACTIVE' } },
    { id: `${questId}-completed`, text: { bm: `${quest.titleBM} · Selesai`, en: `${quest.titleEN} · Completed` }, nextNodeId: `${questId}-completed-node`, condition: { type: 'QUEST_STATUS', questId, status: 'COMPLETED' } },
    { id: `${questId}-locked`, text: { bm: `${quest.titleBM} · Terkunci`, en: `${quest.titleEN} · Locked` }, nextNodeId: `${questId}-locked-node`, condition: { type: 'QUEST_STATUS', questId, status: 'LOCKED' } },
  ]
}

function questNodes(questId: string, menuNodeId: string): DialogueNode[] {
  return [
    {
      id: `${questId}-offer`, questId,
      text: { bm: 'Misi ini tersedia. Terima hanya jika kamu mahu menjalankannya sekarang.', en: 'This quest is available. Accept it only if you wish to undertake it now.' },
      choices: [
        { id: `${questId}-accept`, text: { bm: 'Terima Misi', en: 'Accept Quest' }, nextNodeId: `${questId}-accepted`, action: { type: 'ACCEPT_QUEST', questId } },
        { id: `${questId}-decline`, text: { bm: 'Bukan sekarang', en: 'Not now' }, nextNodeId: menuNodeId },
      ],
    },
    {
      id: `${questId}-accepted`, questId,
      text: { bm: 'Misi telah diterima. Kamu boleh memilih misi yang hendak dijejak melalui Log Quest.', en: 'The quest has been accepted. You can choose which quest to track through the Quest Log.' },
      nextNodeId: menuNodeId,
    },
    {
      id: `${questId}-active-node`, questId,
      text: { bm: 'Misi ini masih berjalan. Teruskan objektifnya apabila kamu bersedia; kemajuan misi lain tidak akan terjejas.', en: 'This quest is still in progress. Continue its objective when ready; other quest progress is unaffected.' },
      nextNodeId: menuNodeId,
    },
    {
      id: `${questId}-completed-node`, questId,
      text: { bm: 'Syabas. Objektif misi ini telah diselesaikan dan kemajuannya kekal direkodkan.', en: 'Well done. This quest objective is complete and its progress remains recorded.' },
      nextNodeId: menuNodeId,
    },
    {
      id: `${questId}-locked-node`, questId,
      text: { bm: 'Misi ini belum tersedia. Selesaikan keperluan yang berkaitan sebelum mencuba lagi.', en: 'This quest is not yet available. Complete its related requirements before trying again.' },
      nextNodeId: menuNodeId,
    },
  ]
}

const keeperQuestIds = [
  'quest-jejak-permulaan',
  'quest-rahsia-wahyu-pertama',
  'quest-jejak-bazar-lama',
  'quest-catatan-wahyu',
  'quest-khazanah-hikmah',
  'quest-catatan-permulaan-wahyu',
  'quest-catatan-zaman-awal-pack-1',
  'quest-lembaran-ilmu-pack-1',
  'quest-nota-balai-ilmu-pack-2',
  'quest-jejak-lembaran-pack-2',
]
const travellerQuestIds = [
  'quest-perjalanan-hijrah',
  'quest-laluan-musafir',
  'quest-jejak-perjalanan-library',
  'quest-jejak-perjalanan-pack-1',
  'quest-catatan-musafir-pack-2',
]

export const DIALOGUE_DEFINITIONS: DialogueDefinition[] = [
  {
    id: 'dialogue-penjaga-balai-ilmu',
    startNodeId: 'welcome',
    conditionalStartNodes: [
      { condition: { type: 'QUEST_STATUS', questId: 'quest-jejak-permulaan', status: 'AVAILABLE' }, nodeId: 'n07d-prologue-available' },
      { condition: { type: 'QUEST_STATUS', questId: 'quest-jejak-permulaan', status: 'ACTIVE' }, nodeId: 'n07d-prologue-active' },
      { condition: { type: 'QUEST_STATUS', questId: 'quest-jejak-permulaan', status: 'COMPLETED' }, nodeId: 'n07d-prologue-completed' },
    ],
    nodes: [
      // N07-D PROTOTYPE / narrative review pending. Fictional learning-route framing only.
      {
        id: 'n07d-prologue-available',
        text: {
          bm: 'Selamat datang ke Kampung Ilmu. Kami sedang menyediakan Laluan Jejak Ilmu, tetapi bahagian permulaannya belum cukup jelas.',
          en: 'Welcome to the Village of Knowledge. We are preparing the Trail of Knowledge, but its opening section is not yet clear enough.',
        },
        choices: [
          { id: 'n07d-offer-help', text: { bm: 'Apa yang saya boleh bantu?', en: 'How can I help?' }, nextNodeId: 'n07d-prologue-guidance' },
          { id: 'n07d-not-now', text: { bm: 'Bukan sekarang', en: 'Not now' }, nextNodeId: 'keeper-menu' },
        ],
      },
      {
        id: 'n07d-prologue-guidance',
        text: {
          bm: 'Mulakan dengan satu petunjuk tentang kehidupan awal Nabi Muhammad ﷺ. Fahami maklumatnya, bukan sekadar kumpulkan jawapan.',
          en: 'Begin with one clue about the early life of Prophet Muhammad ﷺ. Understand the information rather than merely collecting answers.',
        },
        nextNodeId: 'quest-jejak-permulaan-offer',
      },
      {
        id: 'n07d-prologue-active',
        text: {
          bm: 'Petunjuk awal berada di sekitar kampung. Teruskan meneroka apabila kamu bersedia.',
          en: 'The opening clue is somewhere around the village. Continue exploring when you are ready.',
        },
        nextNodeId: 'keeper-menu',
      },
      {
        id: 'n07d-prologue-completed',
        text: {
          bm: 'Kamu telah menyelesaikan Jejak Permulaan. Sekarang kita mempunyai asas untuk menyusun bahagian pertama laluan pembelajaran. Kawasan lain boleh diterokai kemudian apabila kamu bersedia.',
          en: 'You have completed the Opening Trail. We now have a foundation for arranging the first part of the learning route. The other areas can be explored later when you are ready.',
        },
        nextNodeId: 'keeper-menu',
      },
      {
        id: 'welcome',
        text: { bm: 'Selamat datang, pengembara. Aku boleh membantumu memilih misi atau memahami cara meneroka.', en: 'Welcome, traveller. I can help you choose a quest or understand how to explore.' },
        nextNodeId: 'keeper-menu',
      },
      {
        id: 'keeper-menu', text: { bm: 'Apakah yang ingin kamu bincangkan?', en: 'What would you like to discuss?' },
        choices: [
          ...questChoiceSet('quest-jejak-permulaan'),
          { id: 'keeper-other-missions', text: { bm: 'Misi Lain', en: 'Other Missions' }, nextNodeId: 'keeper-other-menu' },
          { id: 'keeper-guidance', text: { bm: 'Panduan penerokaan', en: 'Exploration guidance' }, nextNodeId: 'explore' },
        ],
      },
      {
        id: 'keeper-other-menu',
        text: { bm: 'Pilih misi lain yang ingin kamu semak.', en: 'Choose another mission you would like to review.' },
        choices: [
          ...keeperQuestIds.slice(1).flatMap(questChoiceSet),
          { id: 'keeper-other-back', text: { bm: 'Kembali', en: 'Back' }, nextNodeId: 'keeper-menu' },
        ],
      },
      {
        id: 'explore',
        text: { bm: 'Terokai dengan tenang. Peta kawasan hanya menunjukkan perkara yang benar-benar telah kamu temui.', en: 'Explore calmly. The area map only shows what you have genuinely discovered.' },
        nextNodeId: 'farewell',
      },
      { id: 'farewell', text: { bm: 'Semoga perjalanan pembelajaranmu dipermudah.', en: 'May your learning journey be made easy.' } },
      ...keeperQuestIds.flatMap((questId) => questNodes(
        questId,
        questId === 'quest-jejak-permulaan' ? 'keeper-menu' : 'keeper-other-menu',
      )),
    ],
  },
  {
    id: 'dialogue-pengembara-bazar', startNodeId: 'greeting',
    nodes: [
      {
        id: 'greeting',
        text: { bm: 'Bazar ini luas. Apakah yang ingin kamu ketahui sebelum meneruskan perjalanan?', en: 'This bazaar is wide. What would you like to know before continuing your journey?' },
        choices: [
          ...travellerQuestIds.flatMap(questChoiceSet),
          { id: 'ask-exploration', text: { bm: 'Bagaimana hendak meneroka dengan selamat?', en: 'How should I explore safely?' }, nextNodeId: 'exploration-answer' },
          { id: 'ask-map', text: { bm: 'Apakah kegunaan tanda pada peta?', en: 'What are the map markers for?' }, nextNodeId: 'map-answer' },
        ],
      },
      {
        id: 'exploration-answer',
        text: { bm: 'Perhatikan lorong dan halangan. Kamu boleh berjalan sendiri atau mengetik kawasan yang boleh dilalui.', en: 'Watch the lanes and obstacles. You can walk directly or tap a reachable space.' },
        nextNodeId: 'farewell',
      },
      {
        id: 'map-answer',
        text: { bm: 'Tanda destinasi membantumu mengingati tempat pilihan. Ia tidak menggerakkanmu secara automatik.', en: 'A destination marker helps you remember a chosen place. It does not move you automatically.' },
        nextNodeId: 'farewell',
      },
      { id: 'farewell', text: { bm: 'Baiklah. Semoga kamu menemui jalan yang bermanfaat.', en: 'Very well. May you find a beneficial path.' } },
      ...travellerQuestIds.flatMap((questId) => questNodes(questId, 'greeting')),
    ],
  },
]
