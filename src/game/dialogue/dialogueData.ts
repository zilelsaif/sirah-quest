import type { DialogueDefinition } from './types'

export const DIALOGUE_DEFINITIONS: DialogueDefinition[] = [
  {
    id: 'dialogue-penjaga-balai-ilmu',
    startNodeId: 'welcome',
    nodes: [
      {
        id: 'welcome',
        text: {
          bm: 'Selamat datang, pengembara. Dekati tanda yang ditemui untuk menyiasat petunjuk di kawasan ini.',
          en: 'Welcome, traveller. Approach discovered markers to investigate clues in this area.',
        },
        nextNodeId: 'explore',
      },
      {
        id: 'explore',
        text: {
          bm: 'Terokai dengan tenang. Peta kawasan hanya menunjukkan perkara yang benar-benar telah kamu temui.',
          en: 'Explore calmly. The area map only shows what you have genuinely discovered.',
        },
        nextNodeId: 'farewell',
      },
      {
        id: 'farewell',
        text: {
          bm: 'Semoga perjalanan pembelajaranmu dipermudah.',
          en: 'May your learning journey be made easy.',
        },
      },
    ],
  },
  {
    id: 'dialogue-pengembara-bazar',
    startNodeId: 'greeting',
    nodes: [
      {
        id: 'greeting',
        text: {
          bm: 'Bazar ini luas. Apakah yang ingin kamu ketahui sebelum meneruskan perjalanan?',
          en: 'This bazaar is wide. What would you like to know before continuing your journey?',
        },
        choices: [
          {
            id: 'ask-exploration',
            text: {
              bm: 'Bagaimana hendak meneroka dengan selamat?',
              en: 'How should I explore safely?',
            },
            nextNodeId: 'exploration-answer',
          },
          {
            id: 'ask-map',
            text: {
              bm: 'Apakah kegunaan tanda pada peta?',
              en: 'What are the map markers for?',
            },
            nextNodeId: 'map-answer',
          },
        ],
      },
      {
        id: 'exploration-answer',
        text: {
          bm: 'Perhatikan lorong dan halangan. Kamu boleh berjalan sendiri atau mengetik kawasan yang boleh dilalui.',
          en: 'Watch the lanes and obstacles. You can walk directly or tap a reachable space.',
        },
        nextNodeId: 'farewell',
      },
      {
        id: 'map-answer',
        text: {
          bm: 'Tanda destinasi membantumu mengingati tempat pilihan. Ia tidak menggerakkanmu secara automatik.',
          en: 'A destination marker helps you remember a chosen place. It does not move you automatically.',
        },
        nextNodeId: 'farewell',
      },
      {
        id: 'farewell',
        text: {
          bm: 'Baiklah. Semoga kamu menemui jalan yang bermanfaat.',
          en: 'Very well. May you find a beneficial path.',
        },
      },
    ],
  },
]
