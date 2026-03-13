'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TimeGrid from '@/components/TimeGrid'
import { Event, ParticipantPublic } from '@/lib/types'
import { mergeSlots, generateSlots, fmtDate, COLORS } from '@/lib/utils'

type Tab = 'common' | 'ranked' | 'grid'

export default function ResultsPage({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<ParticipantPublic[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<Tab>('common')
  const [copiedCommon, setCopiedCommon] = useState(false)
  const [copiedRanked, setCopiedRanked] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/events/${params.eventId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.event) {
          setNotFound(true)
          return
        }
        setEvent(d.event)
        const parts: ParticipantPublic[] = d.participants || []
        setParticipants(parts)
        setCheckedIds(new Set(parts.map((p: ParticipantPublic) => p.id)))
      })
  }, [params.eventId])

  useEffect(() => {
    load()
  }, [load])

  const commonSlots = (() => {
    if (!checkedIds.size) return []
    const selected = participants.filter(p => checkedIds.has(p.id))
    if (!selected.length) return []
    const sets = selected.map(p => new Set(p.slots))
    const common = Array.from(sets[0]).filter(s => sets.every(set => set.has(s)))
    return mergeSlots(common)
  })()

  const commonText = (() => {
    if (!commonSlots.length) return ''
    const names = participants.filter(p => checkedIds.has(p.id)).map(p => p.display_name).join('、')
    const header = `${names}が可能な時間帯`
    const lines = commonSlots.map(r => {
      const [, mo, day] = r.date.split('-')
      return `${parseInt(mo)}/${parseInt(day)} ${r.start}〜${r.end}`
    })
    return [header, ...lines].join('\n')
  })()

  const rankedGroups = (() => {
    if (!event || !participants.length) return []
    const slotCount: Record<string, number> = {}
    const slotNames: Record<string, string[]> = {}
    const allSlots: string[] = []

    event.dates.forEach(d => {
      const s = generateSlots(d, event.start_time, event.end_time)
      s.forEach(sl => {
        slotCount[sl] = 0
        slotNames[sl] = []
        allSlots.push(sl)
      })
    })

    participants.forEach(p => {
      p.slots.forEach(s => {
        if (slotCount[s] !== undefined) {
          slotCount[s]++
          slotNames[s].push(p.display_name)
        }
      })
    })

    const sorted = [...allSlots].sort()

    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    const groups: { date: string; start: string; end: string; count: number; names: string[] }[] = []

    let gStart = sorted[0]
    let gPrev = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i]
      const prev = sorted[i - 1]
      const [pd, pt] = prev.split('T')
      const [cd, ct] = cur.split('T')

      if (pd === cd && toMin(ct) === toMin(pt) + 30 && slotCount[cur] === slotCount[prev]) {
        gPrev = cur
      } else {
        const slots = sorted.filter(s => s >= gStart && s <= gPrev)
        const names = Array.from(new Set(slots.flatMap(s => slotNames[s])))
        const [, st] = gStart.split('T')
        const [, et] = gPrev.split('T')
        const em = toMin(et) + 30
        const endStr = `${String(Math.floor(em / 60)).padStart(2, '0')}:${String(em % 60).padStart(2, '0')}`

        groups.push({
          date: gStart.split('T')[0],
          start: st,
          end: endStr,
          count: slotCount[gStart],
          names,
        })

        gStart = cur
        gPrev = cur
      }
    }

    const slots2 = sorted.filter(s => s >= gStart && s <= gPrev)
    const names2 = Array.from(new Set(slots2.flatMap(s => slotNames[s])))
    const [, st2] = gStart.split('T')
    const [, et2] = gPrev.split('T')
    const em2 = toMin(et2) + 30

    groups.push({
      date: gStart.split('T')[0],
      start: st2,
      end: `${String(Math.floor(em2 / 60)).padStart(2, '0')}:${String(em2 % 60).padStart(2, '0')}`,
      count: slotCount[gStart],
      names: names2,
    })

    return groups
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  })()

  const rankedText = (() => {
    if (!rankedGroups.length) return ''
    const byCount: Record<number, typeof rankedGroups> = {}
    rankedGroups.forEach(g => {
      if (!byCount[g.count]) byCount[g.count] = []
      byCount[g.count].push(g)
    })
    const keys = Object.keys(byCount).map(Number).sort((a, b) => b - a)
    const lines: string[] = []

    keys.forEach((cnt, i) => {
      if (i > 0) lines.push('')
      lines.push(`${cnt}人の時間帯`)
      byCount[cnt].forEach(g => {
        const [, mo, day] = g.date.split('-')
        lines.push(`${parseInt(mo)}/${parseInt(day)} ${g.start}〜${g.end}`)
      })
    })

    return lines.join('\n')
  })()

  const copyCommon = async () => {
    if (!commonText) return
    await navigator.clipboard.writeText(commonText)
    setCopiedCommon(true)
    setTimeout(() => setCopiedCommon(false), 2000)
  }

  const copyRanked = async () => {
    if (!rankedText) return
    await navigator.clipboard.writeText(rankedText)
    setCopiedRanked(true)
    setTimeout(() => setCopiedRanked(false), 2000)
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2>イベントが見つかりません</h2>
        <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>トップへ戻る</a>
      </div>
    )
  }

  if (!event) {
    return <div style={{ padding: 32, color: 'var(--muted)' }}>読み込み中...</div>
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{event.title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        {event.dates.length}日間 / {event.start_time}〜{event.end_time} / {participants.length}名参加
      </p>

      <div className="tabs">
        {(['common', 'ranked', 'grid'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'common' ? '参加者指定' : t === 'ranked' ? '人数順' : 'カレンダー'}
          </button>
        ))}
      </div>

      {tab === 'common' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>参加者を選択</div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                fontSize: 13,
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checkedIds.size === participants.length}
                onChange={e =>
                  setCheckedIds(e.target.checked ? new Set(participants.map(p => p.id)) : new Set())
                }
                style={{ accentColor: 'var(--teal)' }}
              />
              すべて選択 / 解除
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {participants.map((p, i) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--cream)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(p.id)}
                    onChange={e =>
                      setCheckedIds(prev => {
                        const n = new Set(prev)
                        if (e.target.checked) {
                          n.add(p.id)
                        } else {
                          n.delete(p.id)
                        }
                        return n
                      })
                    }
                    style={{ accentColor: 'var(--teal)' }}
                  />
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: COLORS[i % COLORS.length],
                      flexShrink: 0,
                    }}
                  />
                  {p.display_name}
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>共通の空き時間</div>
            {commonSlots.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>
                {checkedIds.size === 0 ? '参加者を選択してください' : '共通の空き時間が見つかりませんでした'}
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {commonSlots.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"DM Serif Display",serif',
                          fontSize: '1.4rem',
                          color: 'var(--teal)',
                          minWidth: 36,
                          textAlign: 'center',
                        }}
                      >
                        {r.start.split(':')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{fmtDate(r.date)}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.start}〜{r.end}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="copy-preview" style={{ marginBottom: 8 }}>{commonText}</div>
                <button className="btn btn-accent btn-full" onClick={copyCommon}>
                  {copiedCommon ? '✓ コピーしました！' : '📋 このテキストをコピー'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'ranked' && (
        <div className="card">
          {rankedGroups.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>まだ参加者がいません</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {rankedGroups.map((g, i) => {
                  const pct = Math.round((g.count / participants.length) * 100)
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"DM Serif Display",serif',
                          fontSize: '1.4rem',
                          color: g.count === participants.length ? 'var(--teal)' : 'var(--muted)',
                          minWidth: 36,
                          textAlign: 'center',
                        }}
                      >
                        {g.count}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {fmtDate(g.date)} {g.start}〜{g.end}
                        </div>
                        <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, margin: '4px 0' }}>
                          <div
                            style={{
                              background: 'var(--teal)',
                              height: 4,
                              borderRadius: 4,
                              width: `${pct}%`,
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {g.names.slice(0, 5).join('、')}
                          {g.names.length > 5 ? `他${g.names.length - 5}名` : ''}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {g.count}/{participants.length}人
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="copy-preview" style={{ marginBottom: 8 }}>{rankedText}</div>
              <button className="btn btn-accent btn-full" onClick={copyRanked}>
                {copiedRanked ? '✓ コピーしました！' : '📋 このテキストをコピー'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'grid' && (
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>各時間帯の参加状況</div>
          <TimeGrid
            dates={event.dates}
            startTime={event.start_time}
            endTime={event.end_time}
            participants={participants}
            mySlots={new Set()}
            editable={false}
          />
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => router.push(`/event/${params.eventId}`)}>
          + 自分の予定を登録する
        </button>
        <button className="btn btn-outline btn-sm" onClick={load}>🔄 更新</button>
      </div>
    </div>
  )
}
