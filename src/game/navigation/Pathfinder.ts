import type { AreaDefinition, AreaObstacle } from '../areas/types'
import type { NavigationOptions, NavigationPoint } from './types'

interface GridCell {
  column: number
  row: number
}

const DEFAULT_OPTIONS: NavigationOptions = {
  cellSize: 32,
  playerRadius: 18,
  blockedTargetSearchCells: 6,
}

const DIRECTIONS = [
  { column: 1, row: 0, cost: 1 },
  { column: -1, row: 0, cost: 1 },
  { column: 0, row: 1, cost: 1 },
  { column: 0, row: -1, cost: 1 },
  { column: 1, row: 1, cost: Math.SQRT2 },
  { column: 1, row: -1, cost: Math.SQRT2 },
  { column: -1, row: 1, cost: Math.SQRT2 },
  { column: -1, row: -1, cost: Math.SQRT2 },
] as const

export class Pathfinder {
  private readonly options: NavigationOptions
  private readonly columns: number
  private readonly rows: number
  private readonly walkable: boolean[][]

  constructor(
    private readonly area: AreaDefinition,
    options: Partial<NavigationOptions> = {},
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.columns = Math.ceil(area.width / this.options.cellSize)
    this.rows = Math.ceil(area.height / this.options.cellSize)
    this.walkable = Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.columns }, (_, column) =>
        this.isPointWalkable(this.cellToPoint({ column, row })),
      ),
    )
  }

  findPath(start: NavigationPoint, requestedTarget: NavigationPoint): NavigationPoint[] {
    const startCell = this.findNearestWalkableCell(this.pointToCell(start), 4)
    if (!startCell) return []

    if (this.isPointWalkable(requestedTarget) && this.hasClearSegment(start, requestedTarget)) {
      return [requestedTarget]
    }

    const targetCell = this.pointToCell(requestedTarget)
    const candidates = this.getTargetCandidates(targetCell, requestedTarget)

    for (const candidate of candidates) {
      const cellPath = this.findGridPath(startCell, candidate)
      if (!cellPath) continue

      const candidatePoint = this.cellToPoint(candidate)
      const resolvedTarget = this.isPointWalkable(requestedTarget) &&
        this.hasClearSegment(candidatePoint, requestedTarget)
        ? requestedTarget
        : candidatePoint
      const points = [start, ...cellPath.slice(1).map((cell) => this.cellToPoint(cell)), resolvedTarget]
      return this.smoothPath(points).slice(1)
    }

    return []
  }

  isPointWalkable(point: NavigationPoint) {
    const radius = this.options.playerRadius
    if (
      point.x < radius ||
      point.x > this.area.width - radius ||
      point.y < radius ||
      point.y > this.area.height - radius
    ) return false

    return !this.area.obstacles.some((obstacle) => this.circleIntersectsObstacle(point, radius, obstacle))
  }

  private circleIntersectsObstacle(point: NavigationPoint, radius: number, obstacle: AreaObstacle) {
    const closestX = Math.max(obstacle.x, Math.min(point.x, obstacle.x + obstacle.width))
    const closestY = Math.max(obstacle.y, Math.min(point.y, obstacle.y + obstacle.height))
    const dx = point.x - closestX
    const dy = point.y - closestY
    return dx * dx + dy * dy <= radius * radius
  }

  private pointToCell(point: NavigationPoint): GridCell {
    return {
      column: Math.max(0, Math.min(this.columns - 1, Math.floor(point.x / this.options.cellSize))),
      row: Math.max(0, Math.min(this.rows - 1, Math.floor(point.y / this.options.cellSize))),
    }
  }

  private cellToPoint(cell: GridCell): NavigationPoint {
    const radius = this.options.playerRadius
    return {
      x: Math.max(radius, Math.min(this.area.width - radius, (cell.column + 0.5) * this.options.cellSize)),
      y: Math.max(radius, Math.min(this.area.height - radius, (cell.row + 0.5) * this.options.cellSize)),
    }
  }

  private getTargetCandidates(target: GridCell, requestedTarget: NavigationPoint) {
    const candidates: GridCell[] = []
    const radius = this.options.blockedTargetSearchCells
    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
        const candidate = {
          column: target.column + columnOffset,
          row: target.row + rowOffset,
        }
        if (this.isCellWalkable(candidate)) candidates.push(candidate)
      }
    }
    return candidates.sort((left, right) => {
      const leftPoint = this.cellToPoint(left)
      const rightPoint = this.cellToPoint(right)
      return Math.hypot(leftPoint.x - requestedTarget.x, leftPoint.y - requestedTarget.y) -
        Math.hypot(rightPoint.x - requestedTarget.x, rightPoint.y - requestedTarget.y)
    })
  }

  private findNearestWalkableCell(origin: GridCell, radius: number) {
    const candidates: GridCell[] = []
    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
        const candidate = { column: origin.column + columnOffset, row: origin.row + rowOffset }
        if (this.isCellWalkable(candidate)) candidates.push(candidate)
      }
    }
    return candidates.sort((left, right) =>
      Math.hypot(left.column - origin.column, left.row - origin.row) -
      Math.hypot(right.column - origin.column, right.row - origin.row),
    )[0]
  }

  private findGridPath(start: GridCell, goal: GridCell): GridCell[] | null {
    const startKey = this.cellKey(start)
    const goalKey = this.cellKey(goal)
    const open = new Set<string>([startKey])
    const cells = new Map<string, GridCell>([[startKey, start]])
    const cameFrom = new Map<string, string>()
    const gScore = new Map<string, number>([[startKey, 0]])
    const fScore = new Map<string, number>([[startKey, this.heuristic(start, goal)]])

    while (open.size > 0) {
      const currentKey = [...open].reduce((best, key) =>
        (fScore.get(key) ?? Infinity) < (fScore.get(best) ?? Infinity) ? key : best,
      )
      const current = cells.get(currentKey)!
      if (currentKey === goalKey) return this.reconstructPath(cameFrom, cells, currentKey)
      open.delete(currentKey)

      for (const direction of DIRECTIONS) {
        const neighbor = {
          column: current.column + direction.column,
          row: current.row + direction.row,
        }
        if (!this.isCellWalkable(neighbor)) continue
        if (direction.column !== 0 && direction.row !== 0) {
          if (
            !this.isCellWalkable({ column: current.column + direction.column, row: current.row }) ||
            !this.isCellWalkable({ column: current.column, row: current.row + direction.row })
          ) continue
        }

        const neighborKey = this.cellKey(neighbor)
        const tentative = (gScore.get(currentKey) ?? Infinity) + direction.cost
        if (tentative >= (gScore.get(neighborKey) ?? Infinity)) continue
        cameFrom.set(neighborKey, currentKey)
        cells.set(neighborKey, neighbor)
        gScore.set(neighborKey, tentative)
        fScore.set(neighborKey, tentative + this.heuristic(neighbor, goal))
        open.add(neighborKey)
      }
    }
    return null
  }

  private reconstructPath(cameFrom: Map<string, string>, cells: Map<string, GridCell>, endKey: string) {
    const path: GridCell[] = [cells.get(endKey)!]
    let currentKey = endKey
    while (cameFrom.has(currentKey)) {
      currentKey = cameFrom.get(currentKey)!
      path.unshift(cells.get(currentKey)!)
    }
    return path
  }

  private smoothPath(points: NavigationPoint[]) {
    if (points.length <= 2) return points
    const result = [points[0]]
    let anchor = 0
    while (anchor < points.length - 1) {
      let next = points.length - 1
      while (next > anchor + 1 && !this.hasClearSegment(points[anchor], points[next])) next -= 1
      result.push(points[next])
      anchor = next
    }
    return result
  }

  private hasClearSegment(start: NavigationPoint, end: NavigationPoint) {
    const distance = Math.hypot(end.x - start.x, end.y - start.y)
    const samples = Math.max(1, Math.ceil(distance / (this.options.cellSize / 3)))
    for (let index = 0; index <= samples; index += 1) {
      const progress = index / samples
      if (!this.isPointWalkable({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      })) return false
    }
    return true
  }

  private isCellWalkable(cell: GridCell) {
    return cell.column >= 0 && cell.column < this.columns &&
      cell.row >= 0 && cell.row < this.rows &&
      this.walkable[cell.row][cell.column]
  }

  private cellKey(cell: GridCell) {
    return `${cell.column},${cell.row}`
  }

  private heuristic(left: GridCell, right: GridCell) {
    const dx = Math.abs(left.column - right.column)
    const dy = Math.abs(left.row - right.row)
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
}
