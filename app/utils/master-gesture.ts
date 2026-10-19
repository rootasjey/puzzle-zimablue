export interface MasterGesturePoint {
  x: number
  y: number
}

export interface MasterGestureStart {
  distance: number
  midpointX: number
  midpointY: number
  zoom: number
  panX: number
  panY: number
}

export interface MasterGestureBounds {
  width: number
  height: number
}

export function createMasterGestureStart(
  first: MasterGesturePoint,
  second: MasterGesturePoint,
  zoom: number,
  panX: number,
  panY: number,
): MasterGestureStart {
  return {
    distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
    midpointX: (first.x + second.x) / 2,
    midpointY: (first.y + second.y) / 2,
    zoom,
    panX,
    panY,
  }
}

export function updateMasterGesture(
  start: MasterGestureStart,
  first: MasterGesturePoint,
  second: MasterGesturePoint,
  bounds: MasterGestureBounds,
) {
  const distance = Math.hypot(first.x - second.x, first.y - second.y)
  const zoom = Math.max(1, Math.min(3, start.zoom * distance / start.distance))
  const midpointX = (first.x + second.x) / 2
  const midpointY = (first.y + second.y) / 2
  const maxX = Math.max(0, bounds.width) * (zoom - 1) / 2
  const maxY = Math.max(0, bounds.height) * (zoom - 1) / 2

  return {
    zoom,
    panX: Math.max(-maxX, Math.min(maxX, start.panX + midpointX - start.midpointX)),
    panY: Math.max(-maxY, Math.min(maxY, start.panY + midpointY - start.midpointY)),
  }
}
