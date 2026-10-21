import assert from 'node:assert/strict'
import test from 'node:test'
import { getPlacedGroupEdges } from '../shared/utils/placed-group-edges.ts'

test('a single placed piece exposes all sides that touch an empty or incorrect slot', () => {
  const order = [0, 3, 2, 1]

  assert.deepEqual(getPlacedGroupEdges(order, 2, 2, 0), {
    top: true,
    right: true,
    bottom: false,
    left: true,
  })
})

test('adjacent placed pieces share one continuous group outline without an interior edge', () => {
  const order = [0, 1, 3, 4, 5, 2]

  assert.deepEqual(getPlacedGroupEdges(order, 2, 3, 0), {
    top: true,
    right: false,
    bottom: true,
    left: true,
  })
  assert.deepEqual(getPlacedGroupEdges(order, 2, 3, 1), {
    top: true,
    right: true,
    bottom: true,
    left: false,
  })
})

test('an incorrect piece or invalid grid has no placed-group outline', () => {
  assert.equal(getPlacedGroupEdges([1, 0], 1, 2, 0), null)
  assert.equal(getPlacedGroupEdges([0, 1], 0, 2, 0), null)
  assert.equal(getPlacedGroupEdges([0], 1, 2, 0), null)
})
