import assert from 'node:assert/strict'
import test from 'node:test'
import { createMasterGestureStart, updateMasterGesture } from '../app/utils/master-gesture.ts'

test('two-finger movement pans the Master without changing zoom', () => {
  const start = createMasterGestureStart({ x: 100, y: 100 }, { x: 200, y: 100 }, 2, 0, 0)
  const result = updateMasterGesture(start, { x: 80, y: 120 }, { x: 180, y: 120 }, { width: 300, height: 300 })

  assert.equal(result.zoom, 2)
  assert.equal(result.panX, -20)
  assert.equal(result.panY, 20)
})

test('pinching changes zoom while the moving midpoint pans the board', () => {
  const start = createMasterGestureStart({ x: 100, y: 100 }, { x: 200, y: 100 }, 1.5, 0, 0)
  const result = updateMasterGesture(start, { x: 90, y: 120 }, { x: 290, y: 120 }, { width: 300, height: 300 })

  assert.equal(result.zoom, 3)
  assert.equal(result.panX, 40)
  assert.equal(result.panY, 20)
})

test('Master gesture zoom and panning stay within the viewport bounds', () => {
  const start = createMasterGestureStart({ x: 100, y: 100 }, { x: 200, y: 100 }, 2, 100, -100)
  const result = updateMasterGesture(start, { x: 100, y: -100 }, { x: 500, y: -100 }, { width: 200, height: 200 })

  assert.equal(result.zoom, 3)
  assert.equal(result.panX, 200)
  assert.equal(result.panY, -200)
})
