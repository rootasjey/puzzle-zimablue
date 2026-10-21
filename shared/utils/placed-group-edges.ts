export interface PlacedGroupEdges {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

/** Returns the exposed sides of a correctly placed piece's contiguous group. */
export function getPlacedGroupEdges(order: readonly number[], gridRows: number, gridColumns: number, slot: number): PlacedGroupEdges | null {
  if (!Number.isInteger(gridRows) || !Number.isInteger(gridColumns) || gridRows < 1 || gridColumns < 1
    || order.length !== gridRows * gridColumns || !Number.isInteger(slot) || slot < 0 || slot >= order.length
    || order[slot] !== slot) return null

  const row = Math.floor(slot / gridColumns)
  const column = slot % gridColumns
  const isPlaced = (neighbor: number) => order[neighbor] === neighbor

  return {
    top: row === 0 || !isPlaced(slot - gridColumns),
    right: column === gridColumns - 1 || !isPlaced(slot + 1),
    bottom: row === gridRows - 1 || !isPlaced(slot + gridColumns),
    left: column === 0 || !isPlaced(slot - 1),
  }
}
