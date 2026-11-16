import Phaser from 'phaser'
import playerKampungUrl from '../../assets/characters/player-kampung-n07c.png'
import hallKeeperUrl from '../../assets/characters/npc-hall-keeper-n07c.png'

export type CharacterDirection = 'front' | 'back' | 'left' | 'right'

interface DirectionFrames {
  idle: number
  walk: readonly [number, number, number]
}

export interface CharacterVisualDefinition {
  textureKey: string
  url: string
  areaId: 'kampung-ilmu-area'
  frameWidth: 128
  frameHeight: 192
  frameCount: 16
  origin: readonly [0.5, 1]
  scale: number
  feetOffsetY: number
  frames: Readonly<Record<CharacterDirection, DirectionFrames>>
}

export const CHARACTER_DIRECTION_FRAMES: CharacterVisualDefinition['frames'] = {
  front: { idle: 0, walk: [1, 2, 3] },
  back: { idle: 4, walk: [5, 6, 7] },
  left: { idle: 8, walk: [9, 10, 11] },
  right: { idle: 12, walk: [13, 14, 15] },
}

const sharedVisual = {
  areaId: 'kampung-ilmu-area',
  frameWidth: 128,
  frameHeight: 192,
  frameCount: 16,
  origin: [0.5, 1],
  scale: 0.4,
  feetOffsetY: 18,
  frames: CHARACTER_DIRECTION_FRAMES,
} as const

export const PLAYER_KAMPUNG_VISUAL: CharacterVisualDefinition = {
  ...sharedVisual,
  textureKey: 'n07c-player-kampung',
  url: playerKampungUrl,
}

export const HALL_KEEPER_VISUAL: CharacterVisualDefinition = {
  ...sharedVisual,
  textureKey: 'n07c-npc-hall-keeper',
  url: hallKeeperUrl,
}

export const N07C_CHARACTER_VISUALS = [PLAYER_KAMPUNG_VISUAL, HALL_KEEPER_VISUAL] as const

export function preloadCharacterVisuals(scene: Phaser.Scene, areaId: string) {
  N07C_CHARACTER_VISUALS.forEach((visual) => {
    if (visual.areaId !== areaId || scene.textures.exists(visual.textureKey)) return
    scene.load.spritesheet(visual.textureKey, visual.url, {
      frameWidth: visual.frameWidth,
      frameHeight: visual.frameHeight,
      endFrame: visual.frameCount - 1,
    })
  })
}

export function createCharacterSprite(
  scene: Phaser.Scene,
  visual: CharacterVisualDefinition,
  frame = visual.frames.front.idle,
) {
  if (!scene.textures.exists(visual.textureKey)) return undefined
  const texture = scene.textures.get(visual.textureKey)
  if (!texture.has(String(frame))) return undefined
  return scene.add.sprite(0, visual.feetOffsetY, visual.textureKey, frame)
    .setOrigin(visual.origin[0], visual.origin[1])
    .setScale(visual.scale)
}

export function directionFromDisplacement(
  displacement: Phaser.Math.Vector2,
  previous: CharacterDirection = 'front',
): CharacterDirection {
  if (displacement.lengthSq() < 0.0001) return previous
  if (Math.abs(displacement.x) > Math.abs(displacement.y)) {
    return displacement.x > 0 ? 'right' : 'left'
  }
  return displacement.y > 0 ? 'front' : 'back'
}

export function frameForCharacter(
  visual: CharacterVisualDefinition,
  direction: CharacterDirection,
  moving: boolean,
  elapsedMs: number,
) {
  const frames = visual.frames[direction]
  return moving ? frames.walk[Math.floor(elapsedMs / 140) % frames.walk.length] : frames.idle
}
