import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Touch + mouse compatible drag-to-reorder.
 * HTML5 `draggable` only fires for mouse, so it silently does nothing on
 * phones. This hook uses Pointer Events instead, which fire for touch,
 * mouse and pen alike — works the same on Android, iOS and desktop.
 *
 * Usage:
 *   const { dragIndex, getHandleProps, getItemProps } = useDragSort(items, async (next) => {
 *     setItems(next)
 *     await service.reorder(next.map(x => x.id))
 *   })
 *   <div {...getItemProps(i)}>
 *     <span {...getHandleProps(i)}>☰</span>
 *     ...
 *   </div>
 */
export function useDragSort(items, onReorder) {
  const itemsRef   = useRef(items)
  const dragFrom   = useRef(null)
  const [dragIndex, setDragIndex] = useState(null)

  useEffect(() => { itemsRef.current = items }, [items])

  const cleanup = useRef(() => {})

  const startDrag = useCallback((index) => (e) => {
    // Only the primary button / single touch starts a drag
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    dragFrom.current = index
    setDragIndex(index)
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      const point = ev.touches ? ev.touches[0] : ev
      const el = document.elementFromPoint(point.clientX, point.clientY)
      const itemEl = el && el.closest('[data-drag-item]')
      if (!itemEl) return
      const idx = parseInt(itemEl.getAttribute('data-drag-item'), 10)
      if (Number.isNaN(idx) || idx === dragFrom.current) return
      const next = [...itemsRef.current]
      const [moved] = next.splice(dragFrom.current, 1)
      next.splice(idx, 0, moved)
      itemsRef.current = next
      dragFrom.current = idx
      setDragIndex(idx)
      onReorder(next)
    }

    const onEnd = () => {
      dragFrom.current = null
      setDragIndex(null)
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }

    window.addEventListener('pointermove', onMove, { passive:true })
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    // Fallback for browsers without full Pointer Event support on touch
    window.addEventListener('touchmove', onMove, { passive:true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)

    cleanup.current = onEnd
  }, [onReorder])

  useEffect(() => () => cleanup.current(), [])

  const getHandleProps = (index) => ({
    onPointerDown: startDrag(index),
    onTouchStart: startDrag(index),
    style: { touchAction: 'none', cursor: 'grab' },
  })

  const getItemProps = (index) => ({
    'data-drag-item': index,
  })

  return { dragIndex, getHandleProps, getItemProps }
}
