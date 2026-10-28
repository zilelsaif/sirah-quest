import { BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'
import type { NpcDefinition } from './types'

export const NPC_DEFINITIONS: NpcDefinition[] = [
  {
    id: 'npc-penjaga-balai-ilmu',
    areaId: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Penjaga Balai Ilmu',
    nameEN: 'Keeper of the Hall of Knowledge',
    roleBM: 'Penjaga balai',
    roleEN: 'Hall keeper',
    position: { x: 500, y: 600 },
    visualKey: 'hall-keeper',
    interactionRadius: 92,
    dialogueId: 'dialogue-penjaga-balai-ilmu',
  },
  {
    id: 'npc-pengembara-bazar',
    areaId: BAZAR_LAMA_AREA_ID,
    nameBM: 'Pengembara Bazar',
    nameEN: 'Bazaar Traveller',
    roleBM: 'Pengembara',
    roleEN: 'Traveller',
    position: { x: 900, y: 900 },
    visualKey: 'bazaar-traveller',
    interactionRadius: 92,
    dialogueId: 'dialogue-pengembara-bazar',
  },
]

export function getNpcsForArea(areaId: string) {
  return NPC_DEFINITIONS.filter((npc) => npc.areaId === areaId)
}
