import Phaser from 'phaser'
import { VISUAL_PALETTE } from '../visuals/visualTheme'
import type { NpcDefinition } from './types'

export function createNpcVisual(scene: Phaser.Scene, npc: NpcDefinition) {
  const isKeeper = npc.visualKey === 'hall-keeper'
  const shadow = scene.add.ellipse(0, 18, 42, 16, 0x000000, 0.28)
  const body = scene.add.rectangle(0, 5, 28, 42, isKeeper ? VISUAL_PALETTE.lapis : 0x9f5f3f)
    .setStrokeStyle(3, VISUAL_PALETTE.ink)
  const mantle = scene.add.triangle(0, -1, -17, 14, 17, 14, 0, -10, isKeeper ? VISUAL_PALETTE.softGold : VISUAL_PALETTE.teal)
  const head = scene.add.circle(0, -20, 10, VISUAL_PALETTE.softGold)
    .setStrokeStyle(3, VISUAL_PALETTE.earth)
  const roleMark = scene.add.text(0, 5, isKeeper ? '✦' : '◇', {
    color: '#fff7df',
    fontFamily: 'Georgia, serif',
    fontSize: '14px',
    fontStyle: 'bold',
  }).setOrigin(0.5)
  const visual = scene.add.container(npc.position.x, npc.position.y, [shadow, body, mantle, head, roleMark])
    .setDepth(9)
    .setVisible(false)

  ;[body, mantle, head, roleMark].forEach((part) => {
    part.setData('npcId', npc.id).setInteractive({ useHandCursor: true })
  })
  return visual
}
