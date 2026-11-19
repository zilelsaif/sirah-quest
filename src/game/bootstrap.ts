import Phaser from 'phaser'
import type { ClueOverlayData } from './clues/types'
import { TestScene } from './scenes/TestScene'
import type { AreaPlaySession } from './session/types'
import type { EffectivePlayerStats } from './progression/types'
import type { AreaDefinition } from './areas/types'
import type { CameraViewMode } from './camera/cameraConfig'
import type { NpcDefinition } from './npcs/types'
import type { WorldObjectDefinition, WorldObjectPanelData, WorldObjectSessionState } from './worldObjects/types'
import type { DevelopmentRenderingConfig } from './performance/renderingConfig'
import type { SceneRenderDiagnostics } from './scenes/TestScene'

export function createGame(
  parent: HTMLElement,
  onCluePanelChange: (clue: ClueOverlayData | null) => void,
  area: AreaDefinition,
  session: AreaPlaySession,
  onSessionChange: (session: AreaPlaySession) => void,
  effectiveStats: EffectivePlayerStats,
  cameraViewMode: CameraViewMode,
  renderingConfig: DevelopmentRenderingConfig,
  onNearbyNpcChange: (npc: NpcDefinition | null) => void,
  onNpcDialogueChange: (npc: NpcDefinition | null) => void,
  worldObjectState: WorldObjectSessionState,
  onWorldObjectStateChange: (state: WorldObjectSessionState) => void,
  discoveredLandmarkIds: readonly string[],
  onLandmarkDiscovered: (landmarkId: string) => void,
  onNearbyWorldObjectChange: (object: WorldObjectDefinition | null) => void,
  onWorldObjectPanelChange: (object: WorldObjectPanelData | null) => void,
  onSceneReady: (diagnostics: SceneRenderDiagnostics) => void,
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
      renderingConfig,
      onNearbyNpcChange,
      onNpcDialogueChange,
      worldObjectState,
      onWorldObjectStateChange,
      discoveredLandmarkIds,
      onLandmarkDiscovered,
      onNearbyWorldObjectChange,
      onWorldObjectPanelChange,
      onSceneReady,
    ),
  })
}
