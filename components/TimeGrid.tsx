'use client'
import { useEffect, useRef } from 'react'
import { generateSlots, COLORS, fmtDate } from '@/lib/utils'
import { ParticipantPublic } from '@/lib/types'

interface Props {
  dates: string[]
  startTime: string
  endTime: string
  participants: ParticipantPublic[]
  mySlots: Set<string>
  onSlotsChange?: (slots: Set<string>) => void
  editable?: boolean
  myParticipantId?: string | null
}

export default function TimeGrid({
  dates, startTime, endTime,
  participants, mySlots, onSlotsChange,
  editable = false, myParticipantId = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const paintMode = useRef<'on' | 'off' | null>(null)
  const isDragging = useRef(false)

  // Build time labels
  const times: string[] = []
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  let h = parseInt(startTime), m = startTime.includes('30') ? 30 : 0
  const [sh, sm] = startTime.split(':').map(Number)
  h = sh; m = sm
  while (h * 60 + m < toMin(endTime)) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30; if (m >= 60) { h++; m = 0 }
  }

  // Color map: exclude current participant from overlay display
  const colorMap: Record<string, string> = {}
  participants.forEach((p, i) => { colorMap[p.id] = COLORS[i % COLORS.length] })

  const toggleCell = (slot: string) => {
    if (!onSlotsChange) return
    const next = new Set(mySlots)
    if (paintMode.current === 'on') next.add(slot)
    else if (paintMode.current === 'off') next.delete(slot)
    onSlotsChange(next)
  }

  useEffect(() => {
    if (!editable) return
    const container = containerRef.current
    if (!container) return

    const onMouseDown = (e: MouseEvent) => {
      const cell = (e.target as Element).closest('[data-slot]') as HTMLElement
      if (!cell) return
      isDragging.current = true
      paintMode.current = mySlots.has(cell.dataset.slot!) ? 'off' : 'on'
      toggleCell(cell.dataset.slot!)
      e.preventDefault()
    }
    const onMouseOver = (e: MouseEvent) => {
      if (!isDragging.current) return
      const cell = (e.target as Element).closest('[data-slot]') as HTMLElement
      if (cell) toggleCell(cell.dataset.slot!)
    }
    const onMouseUp = () => { isDragging.current = false; paintMode.current = null }

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const cell = el?.closest('[data-slot]') as HTMLElement
      if (!cell) return
      isDragging.current = true
      paintMode.current = mySlots.has(cell.dataset.slot!) ? 'off' : 'on'
      toggleCell(cell.dataset.slot!)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const cell = el?.closest('[data-slot]') as HTMLElement
      if (cell) toggleCell(cell.dataset.slot!)
      e.preventDefault()
    }
    const onTouchEnd = () => { isDragging.current = false; paintMode.current = null }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  })

  return (
    <div className="grid-wrapper">
      <div
        ref={containerRef}
        className="time-grid"
        style={{ gridTemplateColumns: `56px repeat(${dates.length}, minmax(80px, 1fr))` }}
      >
        {/* Header */}
        <div className="grid-corner">時刻</div>
        {dates.map(d => {
          const dt = new Date(d + 'T00:00:00')
          const dow = ['日','月','火','水','木','金','土'][dt.getDay()]
          return (
            <div key={d} className="grid-date-header">
              <div>{dt.getMonth() + 1}/{dt.getDate()}</div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{dow}</div>
            </div>
          )
        })}

        {/* Rows */}
        {times.map(t => (
          <>
            <div key={`tl-${t}`} className="grid-time-label">{t}</div>
            {dates.map(d => {
              const slot = `${d}T${t}`
              const isMine = mySlots.has(slot)
              const others = participants.filter(p =>
                p.slots.includes(slot) && p.id !== myParticipantId
              )
              return (
                <div
                  key={slot}
                  data-slot={slot}
                  className={`grid-cell${isMine ? ' selected-mine' : ''}`}
                >
                  {others.length > 0 && (
                    <div className="cell-participants">
                      {others.slice(0, 3).map(p => (
                        <span
                          key={p.id}
                          className="participant-tag"
                          style={{ background: colorMap[p.id] || COLORS[0] }}
                        >
                          {p.display_name}
                        </span>
                      ))}
                      {others.length > 3 && (
                        <span className="participant-tag" style={{ background: 'var(--muted)' }}>
                          +{others.length - 3}名
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
