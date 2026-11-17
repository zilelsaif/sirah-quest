import Phaser from 'phaser'
import grassBaseUrl from '../../assets/environments/kampung-ilmu/ki_g01_grass_base.png'
import grassVariationUrl from '../../assets/environments/kampung-ilmu/ki_g02_grass_variation.png'
import dirtFillUrl from '../../assets/environments/kampung-ilmu/ki_g03_dirt_fill.png'
import dirtEdgeUrl from '../../assets/environments/kampung-ilmu/ki_g04_dirt_edge.png'
import grassTuftUrl from '../../assets/environments/kampung-ilmu/ki_v01_grass_tuft.png'
import wildflowersUrl from '../../assets/environments/kampung-ilmu/ki_v02_wildflowers.png'
import shrubUrl from '../../assets/environments/kampung-ilmu/ki_v03_shrub.png'
import smallRocksUrl from '../../assets/environments/kampung-ilmu/ki_v04_small_rocks.png'
import houseWideUrl from '../../assets/environments/kampung-ilmu/ki-b01_house_wide.png'
import houseCompactUrl from '../../assets/environments/kampung-ilmu/ki-b02_house_compact.png'
import learningHallUrl from '../../assets/environments/kampung-ilmu/ki-b03_learning_hall.png'
import readingHutUrl from '../../assets/environments/kampung-ilmu/ki-b04_reading_hut.png'
import storageShedUrl from '../../assets/environments/kampung-ilmu/ki-b05_storage_shed.png'
import fenceHorizontalUrl from '../../assets/environments/kampung-ilmu/ki-f01_fence_horizontal.png'
import fenceVerticalUrl from '../../assets/environments/kampung-ilmu/ki-f02_fence_vertical.png'
import oldWellUrl from '../../assets/environments/kampung-ilmu/ki-l01_well.png'
import treeUrl from '../../assets/environments/kampung-ilmu/ki-t01_tree.png'
import noticeBoardUrl from '../../assets/environments/kampung-ilmu/ki-p01_notice_board.png'
import trailSignUrl from '../../assets/environments/kampung-ilmu/ki-p02_trail_sign_blank.png'
import toolChestClosedUrl from '../../assets/environments/kampung-ilmu/ki-p03_tool_chest_closed.png'
import toolChestOpenUrl from '../../assets/environments/kampung-ilmu/ki-p04_tool_chest_open.png'
import raisedPlanterUrl from '../../assets/environments/kampung-ilmu/ki-p05_raised_planter.png'
import stoneWallUrl from '../../assets/environments/kampung-ilmu/ki-p06_stone_wall.png'

export const KAMPUNG_TEXTURES = {
  grassBase: 'n09c-ki-g01-grass-base', grassVariation: 'n09c-ki-g02-grass-variation',
  dirtFill: 'n09c-ki-g03-dirt-fill', dirtEdge: 'n09c-ki-g04-dirt-edge',
  grassTuft: 'n09c-ki-v01-grass-tuft', wildflowers: 'n09c-ki-v02-wildflowers',
  shrub: 'n09c-ki-v03-shrub', smallRocks: 'n09c-ki-v04-small-rocks',
  houseWide: 'n09c-ki-b01-house-wide', houseCompact: 'n09c-ki-b02-house-compact',
  learningHall: 'n09c-ki-b03-learning-hall', readingHut: 'n09c-ki-b04-reading-hut',
  storageShed: 'n09c-ki-b05-storage-shed', fenceHorizontal: 'n09c-ki-f01-fence-horizontal',
  fenceVertical: 'n09c-ki-f02-fence-vertical', oldWell: 'n09c-ki-l01-old-well',
  tree: 'n09c-ki-t01-tree', noticeBoard: 'n09c-ki-p01-notice-board',
  trailSign: 'n09c-ki-p02-trail-sign', toolChestClosed: 'n09c-ki-p03-tool-chest-closed',
  toolChestOpen: 'n09c-ki-p04-tool-chest-open', raisedPlanter: 'n09c-ki-p05-raised-planter',
  stoneWall: 'n09c-ki-p06-stone-wall',
} as const

const KAMPUNG_TEXTURE_URLS: ReadonlyArray<readonly [string, string]> = [
  [KAMPUNG_TEXTURES.grassBase, grassBaseUrl], [KAMPUNG_TEXTURES.grassVariation, grassVariationUrl],
  [KAMPUNG_TEXTURES.dirtFill, dirtFillUrl], [KAMPUNG_TEXTURES.dirtEdge, dirtEdgeUrl],
  [KAMPUNG_TEXTURES.grassTuft, grassTuftUrl], [KAMPUNG_TEXTURES.wildflowers, wildflowersUrl],
  [KAMPUNG_TEXTURES.shrub, shrubUrl], [KAMPUNG_TEXTURES.smallRocks, smallRocksUrl],
  [KAMPUNG_TEXTURES.houseWide, houseWideUrl], [KAMPUNG_TEXTURES.houseCompact, houseCompactUrl],
  [KAMPUNG_TEXTURES.learningHall, learningHallUrl], [KAMPUNG_TEXTURES.readingHut, readingHutUrl],
  [KAMPUNG_TEXTURES.storageShed, storageShedUrl], [KAMPUNG_TEXTURES.fenceHorizontal, fenceHorizontalUrl],
  [KAMPUNG_TEXTURES.fenceVertical, fenceVerticalUrl], [KAMPUNG_TEXTURES.oldWell, oldWellUrl],
  [KAMPUNG_TEXTURES.noticeBoard, noticeBoardUrl],
  [KAMPUNG_TEXTURES.trailSign, trailSignUrl], [KAMPUNG_TEXTURES.toolChestClosed, toolChestClosedUrl],
  [KAMPUNG_TEXTURES.toolChestOpen, toolChestOpenUrl], [KAMPUNG_TEXTURES.raisedPlanter, raisedPlanterUrl],
]

// Accepted handoff assets without a safe current collision footprint. Kept for future mapped use,
// but deliberately excluded from the runtime preload list.
export const KAMPUNG_RESERVED_TEXTURE_URLS = {
  [KAMPUNG_TEXTURES.tree]: treeUrl,
  [KAMPUNG_TEXTURES.stoneWall]: stoneWallUrl,
} as const

export function preloadKampungEnvironmentVisuals(scene: Phaser.Scene) {
  KAMPUNG_TEXTURE_URLS.forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
}

export const KAMPUNG_OBSTACLE_TEXTURES: ReadonlyArray<string | readonly string[]> = [
  KAMPUNG_TEXTURES.houseWide,
  [KAMPUNG_TEXTURES.raisedPlanter, KAMPUNG_TEXTURES.raisedPlanter],
  KAMPUNG_TEXTURES.houseWide,
  KAMPUNG_TEXTURES.houseCompact,
  KAMPUNG_TEXTURES.houseWide,
  KAMPUNG_TEXTURES.houseCompact,
  KAMPUNG_TEXTURES.houseWide,
  [KAMPUNG_TEXTURES.fenceVertical, KAMPUNG_TEXTURES.fenceVertical],
  [KAMPUNG_TEXTURES.fenceVertical, KAMPUNG_TEXTURES.fenceVertical],
  [KAMPUNG_TEXTURES.fenceVertical, KAMPUNG_TEXTURES.fenceVertical],
  KAMPUNG_TEXTURES.learningHall,
  KAMPUNG_TEXTURES.fenceHorizontal,
  KAMPUNG_TEXTURES.storageShed,
  KAMPUNG_TEXTURES.houseWide,
]
