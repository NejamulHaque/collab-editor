import { useRef, useState, useEffect } from 'react'
import * as Y from 'yjs'

export default function SketchPanel({ ydocRef, onClose }) {
  const canvasRef = useRef(null)
  const [color, setColor] = useState('#6366f1')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState([])
  const [currentStroke, setCurrentStroke] = useState(null)

  useEffect(() => {
    if (!ydocRef.current) return
    const ydoc = ydocRef.current
    const yStrokes = ydoc.getArray('sketch-strokes')

    const updateStrokes = () => {
      setStrokes(yStrokes.toArray())
      renderCanvas(yStrokes.toArray())
    }

    yStrokes.observe(updateStrokes)
    updateStrokes()

    return () => yStrokes.unobserve(updateStrokes)
  }, [ydocRef])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement
        canvasRef.current.width = parent.clientWidth
        canvasRef.current.height = parent.clientHeight - 80
        renderCanvas(strokes)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [strokes])

  function renderCanvas(allStrokes) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    allStrokes.forEach(s => {
      if (!s.points || s.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = s.color || '#000'
      ctx.lineWidth = s.width || 3
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y)
      }
      ctx.stroke()
    })
  }

  function startDrawing(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setIsDrawing(true)
    setCurrentStroke({ color, width: brushSize, points: [{ x, y }] })
  }

  function draw(e) {
    if (!isDrawing) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentStroke(prev => ({
      ...prev,
      points: [...prev.points, { x, y }]
    }))

    // Real-time local preview
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    const lastPoint = currentStroke.points[currentStroke.points.length - 1]
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDrawing() {
    if (!isDrawing || !currentStroke) return
    setIsDrawing(false)
    const ydoc = ydocRef.current
    if (ydoc) {
      const yStrokes = ydoc.getArray('sketch-strokes')
      yStrokes.push([currentStroke])
    }
    setCurrentStroke(null)
  }

  function clearCanvas() {
    if (!window.confirm('Clear all drawings for everyone?')) return
    const yStrokes = ydocRef.current?.getArray('sketch-strokes')
    if (yStrokes) {
      yStrokes.delete(0, yStrokes.length)
    }
  }

  return (
    <div style={panel}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎨</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Sketchboard</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearCanvas} title="Clear board" style={iconBtn}>🗑</button>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>
      </div>

      <div style={toolbar}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#000'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 20, height: 20, borderRadius: '50%', background: c,
                border: color === c ? '2px solid var(--text)' : '1px solid var(--border)',
                cursor: 'pointer', padding: 0
              }}
            />
          ))}
        </div>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <select value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} style={select}>
          {[2, 4, 6, 10].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
      </div>

      <div style={{ flex: 1, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }
const toolbar = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)', borderRadius: 6 }
const select = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text)', outline: 'none', padding: '2px 4px' }
