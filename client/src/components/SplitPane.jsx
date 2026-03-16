import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * SplitPane — a resizable two or three-panel layout.
 * Props:
 *   left    — ReactNode (file tree)
 *   center  — ReactNode (editor)
 *   right   — ReactNode | null (AI / comments / history / chat)
 *   bottom  — ReactNode | null (terminal)
 *   leftWidth   — initial left width in px (default 220)
 *   rightWidth  — initial right width in px (default 320)
 *   bottomHeight — initial bottom height in px (default 220)
 */
export default function SplitPane({
  left, center, right, bottom,
  leftWidth: initLeft = 220,
  rightWidth: initRight = 320,
  bottomHeight: initBottom = 220,
}) {
  const [leftW, setLeftW]     = useState(initLeft)
  const [rightW, setRightW]   = useState(initRight)
  const [bottomH, setBottomH] = useState(initBottom)
  const dragging = useRef(null)

  const onMouseDown = useCallback((which) => (e) => {
    e.preventDefault()
    dragging.current = { which, startX: e.clientX, startY: e.clientY, leftW, rightW, bottomH }
  }, [leftW, rightW, bottomH])

  useEffect(() => {
    function onMouseMove(e) {
      const d = dragging.current
      if (!d) return
      if (d.which === 'left') {
        setLeftW(Math.max(140, Math.min(500, d.leftW + (e.clientX - d.startX))))
      } else if (d.which === 'right') {
        setRightW(Math.max(200, Math.min(600, d.rightW - (e.clientX - d.startX))))
      } else if (d.which === 'bottom') {
        setBottomH(Math.max(80, Math.min(500, d.bottomH - (e.clientY - d.startY))))
      }
    }
    function onMouseUp() { dragging.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const hasLeft   = !!left
  const hasRight  = !!right
  const hasBottom = !!bottom

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Top row: left | center | right */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left panel */}
        {hasLeft && (
          <>
            <div style={{ width: leftW, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {left}
            </div>
            <div
              onMouseDown={onMouseDown('left')}
              style={divider('vertical')}
            />
          </>
        )}

        {/* Center panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {center}
        </div>

        {/* Right panel */}
        {hasRight && (
          <>
            <div
              onMouseDown={onMouseDown('right')}
              style={divider('vertical')}
            />
            <div style={{ width: rightW, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {right}
            </div>
          </>
        )}
      </div>

      {/* Bottom panel (terminal) */}
      {hasBottom && (
        <>
          <div
            onMouseDown={onMouseDown('bottom')}
            style={divider('horizontal')}
          />
          <div style={{ height: bottomH, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {bottom}
          </div>
        </>
      )}
    </div>
  )
}

function divider(dir) {
  const v = dir === 'vertical'
  return {
    width:  v ? 4 : '100%',
    height: v ? '100%' : 4,
    background: 'var(--border)',
    cursor: v ? 'col-resize' : 'row-resize',
    flexShrink: 0,
    transition: 'background .15s',
    zIndex: 10,
    ':hover': { background: 'var(--accent)' },
  }
}
