const boardStage = document.querySelector('#boardStage')
const board = document.querySelector('#puzzleBoard')
const moveCount = document.querySelector('#moveCount')
const gameStatus = document.querySelector('#gameStatus')
const sizeButtons = [...document.querySelectorAll('[data-size]')]

let size = 16
let order = []
let moves = 0
let selectedPosition = null
let focusedPosition = 0
let zoom = 1
let panX = 0
let panY = 0
let suppressNextClick = false
const activePointers = new Map()
let panGesture = null
let pinchGesture = null

function createOrder(gridSize) {
  const pieces = Array.from({ length: gridSize * gridSize }, (_, index) => index)
  let seed = (20261019 + gridSize * 374761393) >>> 0
  for (let index = pieces.length - 1; index > 0; index--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const other = seed % (index + 1)
    ;[pieces[index], pieces[other]] = [pieces[other], pieces[index]]
  }
  if (pieces.every((piece, index) => piece === index)) [pieces[0], pieces[1]] = [pieces[1], pieces[0]]
  return pieces
}

function setTileImage(tile, position) {
  const piece = order[position]
  const column = piece % size
  const row = Math.floor(piece / size)
  const left = size > 1 ? column / (size - 1) * 100 : 0
  const top = size > 1 ? row / (size - 1) * 100 : 0
  tile.style.backgroundPosition = `${left}% ${top}%`
  tile.setAttribute('aria-label', `Case ${Math.floor(position / size) + 1}, ${position % size + 1} ; fragment ${piece + 1}`)
  tile.setAttribute('aria-rowindex', String(Math.floor(position / size) + 1))
  tile.setAttribute('aria-colindex', String(position % size + 1))
  tile.setAttribute('aria-selected', String(selectedPosition === position))
}

function renderBoard() {
  board.replaceChildren()
  board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`
  board.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`
  board.style.setProperty('--size', size)
  board.style.setProperty('--image', 'url("./master-art-placeholder.svg")')
  board.setAttribute('aria-label', `Plateau Master, ${size} lignes par ${size} colonnes`)

  order.forEach((_, position) => {
    const tile = document.createElement('button')
    tile.className = 'tile'
    tile.type = 'button'
    tile.setAttribute('role', 'gridcell')
    tile.tabIndex = position === focusedPosition ? 0 : -1
    tile.addEventListener('click', () => selectTile(position))
    board.append(tile)
    setTileImage(tile, position)
  })

  updateMoveCount()
  updateStatus('Échange deux pièces pour reconstituer l’image.')
}

function updateSelection() {
  board.querySelectorAll('.tile').forEach((tile, position) => {
    tile.classList.toggle('is-selected', selectedPosition === position)
    tile.setAttribute('aria-selected', String(selectedPosition === position))
    tile.tabIndex = position === focusedPosition ? 0 : -1
  })
}

function selectTile(position) {
  if (suppressNextClick) {
    suppressNextClick = false
    return
  }
  focusedPosition = position
  if (selectedPosition === null) {
    selectedPosition = position
    updateSelection()
    updateStatus('Première pièce choisie. Sélectionne la seconde.')
    return
  }
  if (selectedPosition === position) {
    selectedPosition = null
    updateSelection()
    updateStatus('Échange deux pièces pour reconstituer l’image.')
    return
  }

  const first = selectedPosition
  ;[order[first], order[position]] = [order[position], order[first]]
  setTileImage(board.children[first], first)
  setTileImage(board.children[position], position)
  moves++
  selectedPosition = null
  updateSelection()
  updateMoveCount()
  updateStatus(order.every((piece, index) => piece === index)
    ? 'Image reconstituée dans la maquette.'
    : 'Pièces échangées. Tu peux continuer.')
}

function updateMoveCount() {
  moveCount.textContent = String(moves)
}

function updateStatus(message) {
  gameStatus.textContent = message
}

function updateTransform() {
  board.style.setProperty('--zoom', zoom.toFixed(2))
  board.style.setProperty('--pan-x', `${panX}px`)
  board.style.setProperty('--pan-y', `${panY}px`)
  document.querySelectorAll('.zoom-readout').forEach((readout) => {
    readout.textContent = `${Math.round(zoom * 100)} %`
  })
  const maxX = Math.max(0, boardStage.clientWidth * (zoom - 1) / 2)
  const maxY = Math.max(0, boardStage.clientHeight * (zoom - 1) / 2)
  panX = Math.max(-maxX, Math.min(maxX, panX))
  panY = Math.max(-maxY, Math.min(maxY, panY))
  board.style.setProperty('--pan-x', `${panX}px`)
  board.style.setProperty('--pan-y', `${panY}px`)
}

function setZoom(value) {
  zoom = Math.max(1, Math.min(3, value))
  if (zoom === 1) panX = panY = 0
  updateTransform()
}

function resetBoard() {
  order = createOrder(size)
  moves = 0
  selectedPosition = null
  focusedPosition = 0
  setZoom(1)
  renderBoard()
  updateStatus('Mélange réinitialisé. Les coups restent dans cette maquette.')
}

sizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    size = Number(button.dataset.size)
    sizeButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    resetBoard()
    updateStatus(`Plateau ${size} × ${size} chargé. Essaie le zoom sur les petites pièces.`)
  })
})

document.querySelectorAll('[data-zoom="out"]').forEach((button) => button.addEventListener('click', () => setZoom(zoom - 0.25)))
document.querySelectorAll('[data-zoom="in"]').forEach((button) => button.addEventListener('click', () => setZoom(zoom + 0.25)))
document.querySelectorAll('[data-zoom="fit"]').forEach((button) => button.addEventListener('click', () => setZoom(1)))
document.querySelector('#shuffleBoard').addEventListener('click', resetBoard)

board.addEventListener('keydown', (event) => {
  const tile = event.target.closest('.tile')
  if (!tile) return
  const current = Number(tile.getAttribute('aria-rowindex')) * size - size + Number(tile.getAttribute('aria-colindex')) - 1
  const next = {
    ArrowLeft: current % size === 0 ? current : current - 1,
    ArrowRight: current % size === size - 1 ? current : current + 1,
    ArrowUp: current < size ? current : current - size,
    ArrowDown: current >= size * (size - 1) ? current : current + size,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  focusedPosition = next
  updateSelection()
  board.children[next]?.focus()
})

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

boardStage.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('.tile') || boardStage
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY, target })

  if (activePointers.size === 1) {
    panGesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX, panY, moved: false }
  } else if (activePointers.size === 2) {
    const [first, second] = [...activePointers.values()]
    first.target.setPointerCapture?.([...activePointers.keys()][0])
    target.setPointerCapture?.(event.pointerId)
    pinchGesture = { distance: distanceBetween(first, second), zoom, panX, panY }
    panGesture = null
    suppressNextClick = true
    event.preventDefault()
  }
})

boardStage.addEventListener('pointermove', (event) => {
  const point = activePointers.get(event.pointerId)
  if (!point) return
  point.x = event.clientX
  point.y = event.clientY

  if (activePointers.size >= 2 && pinchGesture) {
    const [first, second] = [...activePointers.values()]
    zoom = Math.max(1, Math.min(3, pinchGesture.zoom * distanceBetween(first, second) / Math.max(1, pinchGesture.distance)))
    panX = pinchGesture.panX
    panY = pinchGesture.panY
    if (zoom === 1) panX = panY = 0
    updateTransform()
    event.preventDefault()
    return
  }

  if (panGesture?.pointerId === event.pointerId && zoom > 1) {
    const deltaX = event.clientX - panGesture.x
    const deltaY = event.clientY - panGesture.y
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) panGesture.moved = true
    if (panGesture.moved) {
      panX = panGesture.panX + deltaX
      panY = panGesture.panY + deltaY
      updateTransform()
      event.preventDefault()
    }
  }
})

function endPointer(event) {
  if (panGesture?.pointerId === event.pointerId && panGesture.moved) suppressNextClick = true
  activePointers.delete(event.pointerId)
  if (activePointers.size < 2) pinchGesture = null
  if (activePointers.size === 0) {
    panGesture = null
    setTimeout(() => { suppressNextClick = false }, 0)
  }
}

boardStage.addEventListener('pointerup', endPointer)
boardStage.addEventListener('pointercancel', endPointer)
boardStage.addEventListener('wheel', (event) => {
  event.preventDefault()
  setZoom(zoom + (event.deltaY < 0 ? 0.15 : -0.15))
}, { passive: false })

window.addEventListener('resize', updateTransform)
order = createOrder(size)
renderBoard()
updateTransform()
