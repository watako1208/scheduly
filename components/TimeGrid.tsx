

'use client'
import { useEffect, useRef, Fragment } from 'react'
import { COLORS } from '@/lib/utils'
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
  dates,
  startTime,
  endTime,
  participants,
  mySlots,
  onSlotsChange,
  editable = false,
  myParticipantId = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const paintMode = useRef<'on' | 'off' | null>(null)
  const isDragging = useRef(false)
  const touchedSlotsRef = useRef<Set<string>>(new Set())

  const times: string[] = []
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const [sh, sm] = startTime.split(':').map(Number)
  let h = sh
  let m = sm

  while (h * 60 + m < toMin(endTime)) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) {
      h++
      m = 0
    }
  }

  const colorMap: Record<string, string> = {}
  participants.forEach((p, i) => {
    colorMap[p.id] = COLORS[i % COLORS.length]
  })

  const toggleCell = (slot: string) => {
    if (!onSlotsChange) return
    const next = new Set(mySlots)
    if (paintMode.current === 'on') next.add(slot)
    if (paintMode.current === 'off') next.delete(slot)
    onSlotsChange(next)
  }

  useEffect(() => {
    if (!editable) return

    const container = containerRef.current
    if (!container) return

    const resetDrag = () => {
      isDragging.current = false
      paintMode.current = null
      touchedSlotsRef.current.clear()
    }

    const applySlot = (slot: string) => {
      if (touchedSlotsRef.current.has(slot)) return
      touchedSlotsRef.current.add(slot)
      toggleCell(slot)
    }

    const findSlotElement = (target: EventTarget | null) => {
      return (target as Element | null)?.closest?.('[data-slot]') as HTMLElement | null
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const cell = findSlotElement(e.target)
      if (!cell) return
      const slot = cell.dataset.slot
      if (!slot) return

      isDragging.current = true
      touchedSlotsRef.current.clear()
      paintMode.current = mySlots.has(slot) ? 'off' : 'on'
      applySlot(slot)
      e.preventDefault()
    }

    const onMouseOver = (e: MouseEvent) => {
      if (!isDragging.current) return
      const cell = findSlotElement(e.target)
      if (!cell) return
      const slot = cell.dataset.slot
      if (!slot) return
      applySlot(slot)
    }

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const cell = findSlotElement(el)
      if (!cell) return
      const slot = cell.dataset.slot
      if (!slot) return

      isDragging.current = true
      touchedSlotsRef.current.clear()
      paintMode.current = mySlots.has(slot) ? 'off' : 'on'
      applySlot(slot)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      const touch = e.touches[0]
      if (!touch) return
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const cell = findSlotElement(el)
      if (!cell) return
      const slot = cell.dataset.slot
      if (!slot) return
      applySlot(slot)
      e.preventDefault()
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mouseover', onMouseOver)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('mouseup', resetDrag)
    document.addEventListener('touchend', resetDrag)
    document.addEventListener('touchcancel', resetDrag)

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mouseover', onMouseOver)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mouseup', resetDrag)
      document.removeEventListener('touchend', resetDrag)
      document.removeEventListener('touchcancel', resetDrag)
    }
  }, [editable, mySlots, onSlotsChange])

  return (
    <div className="grid-wrapper">
      <div
        ref={containerRef}
        className="time-grid"
        style={{ gridTemplateColumns: `56px repeat(${dates.length}, minmax(80px, 1fr))` }}
      >
        <div className="grid-corner">時刻</div>

        {dates.map(d => {
          const dt = new Date(`${d}T00:00:00`)
          const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
          return (
            <div key={d} className="grid-date-header">
              <div>{dt.getMonth() + 1}/{dt.getDate()}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{dow}</div>
            </div>
          )
        })}

        {times.map(t => (
          <Fragment key={t}>
            <div className="grid-time-label">{t}</div>
            {dates.map(d => {
              const slot = `${d}T${t}`
              const isMine = mySlots.has(slot)
              const others = participants.filter(
                p => p.slots.includes(slot) && p.id !== myParticipantId
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
                        <span
                          className="participant-tag"
                          style={{ background: 'var(--muted)' }}
                        >
                          +{others.length - 3}名
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
