export interface KampungRoadPath {
  id: string
  purpose: string
  width: number
  points: readonly (readonly [number, number])[]
}

export const KAMPUNG_ROAD_PATHS: readonly KampungRoadPath[] = [
  {
    id: 'main-village-road', purpose: 'Spawn to the central village junction', width: 84,
    points: [[300, 300], [320, 520], [700, 620], [760, 900], [1080, 1040], [1240, 1120]],
  },
  {
    id: 'north-residential-road', purpose: 'Northern route around the raised planters', width: 54,
    points: [[700, 620], [780, 430], [1200, 400], [1480, 380], [1540, 620]],
  },
  {
    id: 'upper-house-access', purpose: 'Front-yard access for residential houses O05 and O06', width: 54,
    points: [[1480, 380], [1600, 360], [1750, 340], [1880, 370], [2025, 370]],
  },
  {
    id: 'lower-house-access', purpose: 'South-facing entrance access for residential house O07', width: 54,
    points: [[1540, 620], [1845, 650], [1845, 600]],
  },
  {
    id: 'garden-west-aisle', purpose: 'Walkable aisle between cultivated rows O08 and O09', width: 54,
    points: [[1540, 620], [1540, 680], [1695, 700], [1695, 1100]],
  },
  {
    id: 'garden-east-aisle', purpose: 'Walkable aisle between cultivated rows O09 and O10', width: 54,
    points: [[1695, 700], [1875, 700], [1875, 1100]],
  },
  {
    id: 'balai-ilmu-approach', purpose: 'East-side approach and south-facing Learning Hall entrance', width: 54,
    points: [[1240, 1120], [1180, 1180], [1180, 1460], [900, 1460], [900, 1455]],
  },
  {
    id: 'village-outskirts-trail', purpose: 'Central junction to the Village Outskirts access point', width: 48,
    points: [[760, 900], [600, 1080], [520, 1200], [500, 1460], [450, 1460]],
  },
] as const

export const KAMPUNG_RESIDENTIAL_ENTRANCES = [
  { obstacleIndex: 4, roadId: 'upper-house-access', point: [1750, 340] },
  { obstacleIndex: 5, roadId: 'upper-house-access', point: [2025, 370] },
  { obstacleIndex: 6, roadId: 'lower-house-access', point: [1845, 600] },
] as const

export const KAMPUNG_ENTRANCE_PATHS: readonly KampungRoadPath[] = [
  {
    id: 'doorstep-house-o05', purpose: 'Threshold from upper-house road to O05 visible steps', width: 28,
    points: [[1750, 340], [1750, 306]],
  },
  {
    id: 'doorstep-house-o06', purpose: 'Threshold from upper-house road to O06 visible steps', width: 28,
    points: [[2025, 370], [2025, 335]],
  },
  {
    id: 'doorstep-house-o07', purpose: 'Threshold from lower-house road to O07 visible steps', width: 28,
    points: [[1845, 600], [1845, 565]],
  },
  {
    id: 'doorstep-balai-ilmu', purpose: 'Entrance apron meeting the Learning Hall steps', width: 28,
    points: [[900, 1455], [900, 1422]],
  },
  {
    id: 'doorstep-storage-shed', purpose: 'Side branch and threshold for storage shed O13', width: 28,
    points: [[1180, 1400], [1260, 1420], [1425, 1395]],
  },
] as const

export const KAMPUNG_ENTRANCE_TARGETS = [
  { pathId: 'doorstep-house-o05', obstacleIndex: 4, visibleGroundY: 286, maxVisualIntrusion: 6 },
  { pathId: 'doorstep-house-o06', obstacleIndex: 5, visibleGroundY: 315, maxVisualIntrusion: 7 },
  { pathId: 'doorstep-house-o07', obstacleIndex: 6, visibleGroundY: 545, maxVisualIntrusion: 7 },
  { pathId: 'doorstep-balai-ilmu', obstacleIndex: 10, visibleGroundY: 1402, maxVisualIntrusion: 10 },
  { pathId: 'doorstep-storage-shed', obstacleIndex: 12, visibleGroundY: 1375, maxVisualIntrusion: 9 },
] as const

export const KAMPUNG_GARDEN_ROWS = [
  { obstacleIndex: 7, planterBottoms: [848, 936, 1024], boundaryFence: 'west' },
  { obstacleIndex: 8, planterBottoms: [848, 936, 1024], boundaryFence: null },
  { obstacleIndex: 9, planterBottoms: [848, 936, 1024], boundaryFence: 'east' },
] as const

export const KAMPUNG_DECORATION_POINTS = [
  [145, 470], [190, 650], [790, 355], [840, 890], [1120, 265], [1410, 610],
  [1530, 350], [2070, 560], [1490, 1160], [1230, 1480], [545, 1480], [175, 1080],
  [2080, 1160], [1510, 1470], [620, 1180], [1160, 1190], [1480, 720], [2110, 1390],
  [90, 850], [850, 1160], [1260, 1030], [2020, 390], [1600, 1120], [430, 940],
] as const

export const KAMPUNG_FRONT_YARD_DETAILS = [
  { texture: 'wildflowers', point: [1680, 340], scale: 0.2 },
  { texture: 'shrub', point: [1820, 330], scale: 0.2 },
  { texture: 'wildflowers', point: [1960, 355], scale: 0.19 },
  { texture: 'shrub', point: [2100, 350], scale: 0.21 },
  { texture: 'wildflowers', point: [1775, 590], scale: 0.2 },
  { texture: 'shrub', point: [1915, 590], scale: 0.2 },
  { texture: 'wildflowers', point: [630, 1465], scale: 0.18 },
  { texture: 'shrub', point: [620, 1240], scale: 0.2 },
] as const

export const KAMPUNG_TREE_PLACEMENT = {
  assetId: 'KI-T01', obstacleIndex: 11, point: [295, 1410], scale: 0.46,
  purpose: 'Village Outskirts boundary tree using the existing O12 non-walkable footprint',
} as const
