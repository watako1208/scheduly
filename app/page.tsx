'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fmtDate } from '@/lib/utils'

const TIMES: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

function CalendarPicker({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (d: string) => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, setY] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())

  const prevMonth = () => { if (mo === 0) { setY(y - 1); setMo(11) } else setMo(mo - 1) }
  const nextMonth = () => { if (mo === 11) { setY(y + 1); setMo(0) } else setMo(mo + 1) }

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const firstDow = new Date(y, mo, 1).getDay()
  const daysInMonth = new Date(y, mo + 1, 0).getDate()

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button className="btn btn-outline btn-sm" onClick={prevMonth}>‹</button>
        <span style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.1rem' }}>{y}年 {months[mo]}</span>
        <button className="btn btn-outline btn-sm" onClick={nextMonth}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {['日','月','火','水','木','金','土'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--muted)', padding:'4px 0 6px' }}>{d}</div>
        ))}
        {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const dateStr = `${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const dt = new Date(y, mo, d)
          const isPast = dt < today
          const isSel = selected.includes(dateStr)
          const isToday = dt.toDateString() === today.toDateString()
          return (
            <div
              key={d}
              onClick={() => !isPast && onToggle(dateStr)}
              style={{
                aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'var(--r-sm)', fontSize:14, cursor: isPast ? 'default' : 'pointer',
                background: isSel ? 'var(--ink)' : undefined,
                color: isPast ? 'var(--border)' : isSel ? 'white' : isToday ? 'var(--accent)' : undefined,
                fontWeight: isToday ? 700 : undefined,
                transition: 'all 0.12s',
              }}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('21:00')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleDate = useCallback((d: string) => {
    setDates(prev => {
      const next = prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
      return next.sort()
    })
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) { setError('イベント名を入力してください'); return }
    if (!dates.length) { setError('候補日を1日以上選択してください'); return }
    if (startTime >= endTime) { setError('終了時刻は開始時刻より後にしてください'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), dates, startTime, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(`/create/complete/${data.shareId}`)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = title.trim() && dates.length > 0 && startTime < endTime && !loading

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 24px 64px' }}>
      <h1 style={{ fontSize:'2rem', marginBottom:8 }}>イベントを作成する</h1>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:32 }}>候補日と時間帯を設定して、参加者に共有しましょう</p>

      <div className="card">
        <div className="field">
          <label>イベント名 <span style={{ color:'var(--accent)' }}>*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：3月のチームランチ" maxLength={80} />
        </div>

        <div className="field">
          <label>候補日を選択 <span style={{ color:'var(--accent)' }}>*</span></label>
          <CalendarPicker selected={dates} onToggle={toggleDate} />
          {dates.length > 0 && (
            <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:6 }}>
              {dates.map(d => (
                <span key={d} className="date-chip">
                  {fmtDate(d)}
                  <button onClick={() => toggleDate(d)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="field" style={{ marginBottom:0 }}>
            <label>開始時刻 <span style={{ color:'var(--accent)' }}>*</span></label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)}>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom:0 }}>
            <label>終了時刻 <span style={{ color:'var(--accent)' }}>*</span></label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)}>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="alert-error" style={{ marginTop:16 }}>{error}</p>}
        <button className="btn btn-primary btn-full" style={{ marginTop:20 }} onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? '作成中...' : 'イベントを作成する →'}
        </button>
      </div>
    </div>
  )
}
