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

const keeperQuestIds = ['quest-jejak-permulaan', 'quest-rahsia-wahyu-pertama']
const travellerQuestIds = ['quest-perjalanan-hijrah']

export const DIALOGUE_DEFINITIONS: DialogueDefinition[] = [
  {
    id: 'dialogue-penjaga-balai-ilmu', startNodeId: 'welcome',
    nodes: [
      {
        id: 'welcome',
        text: { bm: 'Selamat datang, pengembara. Aku boleh membantumu memilih misi atau memahami cara meneroka.', en: 'Welcome, traveller. I can help you choose a quest or understand how to explore.' },
        nextNodeId: 'keeper-menu',
      },
      {
        id: 'keeper-menu', text: { bm: 'Apakah yang ingin kamu bincangkan?', en: 'What would you like to discuss?' },
        choices: [
          ...keeperQuestIds.flatMap(questChoiceSet),
          { id: 'keeper-guidance', text: { bm: 'Panduan penerokaan', en: 'Exploration guidance' }, nextNodeId: 'explore' },
        ],
      },
      {
        id: 'explore',
        text: { bm: 'Terokai dengan tenang. Peta kawasan hanya menunjukkan perkara yang benar-benar telah kamu temui.', en: 'Explore calmly. The area map only shows what you have genuinely discovered.' },
        nextNodeId: 'farewell',
      },
      { id: 'farewell', text: { bm: 'Semoga perjalanan pembelajaranmu dipermudah.', en: 'May your learning journey be made easy.' } },
      ...keeperQuestIds.flatMap((questId) => questNodes(questId, 'keeper-menu')),
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
