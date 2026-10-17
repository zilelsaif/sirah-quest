import Phaser from 'phaser'
import type { CluePanelData } from './clues/types'
import { TestScene } from './scenes/TestScene'

export function createGame(
  parent: HTMLElement,
  onCluePanelChange: (clue: CluePanelData | null) => void,
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
    scene: new TestScene(onCluePanelChange),
  })
}
