import Phaser from 'phaser'
import type { CluePanelData } from './clues/types'
import { TestScene } from './scenes/TestScene'
import type { AreaPlaySession } from './session/types'
import type { EffectivePlayerStats } from './progression/types'
import type { AreaDefinition } from './areas/types'
import type { CameraViewMode } from './camera/cameraConfig'
import type { NpcDefinition } from './npcs/types'

export function createGame(
  parent: HTMLElement,
  onCluePanelChange: (clue: CluePanelData | null) => void,
  area: AreaDefinition,
  session: AreaPlaySession,
  onSessionChange: (session: AreaPlaySession) => void,
  effectiveStats: EffectivePlayerStats,
  cameraViewMode: CameraViewMode,
  onNearbyNpcChange: (npc: NpcDefinition | null) => void,
  onNpcDialogueChange: (npc: NpcDefinition | null) => void,
) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#18283a',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    input: {
      activePointers: 2,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    scene: new TestScene(
      onCluePanelChange,
      area,
      session,
      onSessionChange,
      effectiveStats,
      cameraViewMode,
      onNearbyNpcChange,
      onNpcDialogueChange,
    ),
  })
}
