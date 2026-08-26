import Phaser from 'phaser'
import { TestScene } from './scenes/TestScene'

export function createGame(parent: HTMLElement) {
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
    scene: TestScene,
  })
}
