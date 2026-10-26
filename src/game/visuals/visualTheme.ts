export const VISUAL_PALETTE = {
  ink: 0x172033,
  deepNavy: 0x0b1628,
  parchment: 0xfff7df,
  cream: 0xf4e7c1,
  sandstone: 0xb88959,
  earth: 0x694735,
  deepTeal: 0x1f5f5b,
  teal: 0x4c9a92,
  lapis: 0x315f83,
  gold: 0xd5a83f,
  softGold: 0xf2d58a,
  success: 0x5da879,
} as const

export const AREA_VISUALS = {
  'kampung-ilmu-area': {
    ground: 0x456b52,
    groundAccent: 0x76905d,
    path: 0xa98b62,
    structureTrim: 0xd3ad6e,
    shadow: 0x16281f,
  },
  'bazar-lama-area': {
    ground: 0x9a7049,
    groundAccent: 0xc08b55,
    path: 0xd3ad72,
    structureTrim: 0xe0b76a,
    shadow: 0x3c281f,
  },
  'perpustakaan-hikmah-area': {
    ground: 0xb8a37a,
    groundAccent: 0xd9c79c,
    path: 0xdccda9,
    structureTrim: 0x58a4a5,
    shadow: 0x3a3530,
  },
} as const

export function getAreaVisuals(areaId: string) {
  return AREA_VISUALS[areaId as keyof typeof AREA_VISUALS] ?? AREA_VISUALS['kampung-ilmu-area']
}
