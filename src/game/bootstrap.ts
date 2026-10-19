import Phaser from 'phaser'
import type { CluePanelData } from './clues/types'
import { TestScene } from './scenes/TestScene'
import type { AreaSessionState } from './session/types'

export function createGame(
  parent: HTMLElement,
  onCluePanelChange: (clue: CluePanelData | null) => void,
  session: AreaSessionState,
  onSessionChange: (session: AreaSessionState) => void,
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
    scene: new TestScene(onCluePanelChange, session, onSessionChange),
  })
}
