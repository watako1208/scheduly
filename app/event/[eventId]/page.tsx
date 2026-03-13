'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TimeGrid from '@/components/TimeGrid'
import { Event, ParticipantPublic } from '@/lib/types'

type Mode = 'form' | 'grid' | 'reauth'

export default function JoinPage({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<ParticipantPublic[]>([])
  const [notFound, setNotFound] = useState(false)

  const [mode, setMode] = useState<Mode>('form')
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [editName, setEditName] = useState('')
  const [editPw, setEditPw] = useState('')
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [mySlots, setMySlots] = useState<Set<string>>(new Set())
  const [isEditMode, setIsEditMode] = useState(false)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch(`/api/events/${params.eventId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.event) {
          setNotFound(true)
          return
        }
        setEvent(d.event)
        setParticipants(d.participants || [])
      })
  }

  useEffect(() => {
    load()
  }, [params.eventId])

  const startInput = () => {
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    setError('')
    setIsEditMode(false)
    setParticipantId(null)
    setMySlots(new Set())
    setMode('grid')
  }

  const verifyEdit = async () => {
    if (!editName.trim() || !editPw) {
      setEditError('名前とパスワードを入力してください')
      return
    }

    setEditError('')

    const res = await fetch('/api/participants/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: params.eventId,
        displayName: editName.trim(),
        password: editPw,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setEditError(data.error)
      return
    }

    setName(editName.trim())
    setPw(editPw)
    setParticipantId(data.participantId)
    setMySlots(new Set(data.slots as string[]))
    setIsEditMode(true)
    setMode('grid')
  }

  const save = async () => {
    if (!name.trim()) return

    setSaving(true)

    try {
      let res: Response

      if (isEditMode && participantId) {
        res = await fetch(`/api/participants/${participantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: pw,
            slots: Array.from(mySlots),
          }),
        })
      } else {
        res = await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event!.id,
            displayName: name.trim(),
            password: pw || null,
            slots: Array.from(mySlots),
          }),
        })
      }

      if (!res.ok) {
        const d = await res.json()
        alert(d.error)
        return
      }

      router.push(`/event/${params.eventId}/results`)
    } finally {
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2>イベントが見つかりません</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>URLが正しいか確認してください</p>
        <a href="/" className="btn btn-primary">新しいイベントを作成</a>
      </div>
    )
  }

  if (!event) {
    return <div style={{ padding: 32, color: 'var(--muted)' }}>読み込み中...</div>
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>
      {isEditMode && (
        <div
          style={{
            background: 'linear-gradient(135deg,var(--teal),var(--teal2))',
            color: 'white',
            padding: '10px 16px',
            borderRadius: 'var(--r-sm)',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          ✏️ <strong>再編集モード</strong> — 登録済みの内容を変更できます
        </div>
      )}

      <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{event.title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        {event.dates.length}日間 / {event.start_time}〜{event.end_time}
      </p>

      {mode === 'form' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>あなたの名前 <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="名前を入力"
              maxLength={40}
              onKeyDown={e => e.key === 'Enter' && startInput()}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>パスワード（任意）</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="後で再編集したい場合は設定"
            />
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              パスワードを設定すると後から内容を変更できます
            </div>
          </div>

          {error && <p className="alert-error" style={{ marginTop: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={startInput}>時間帯を選ぶ →</button>
            <button className="btn btn-outline btn-sm" onClick={() => setMode('reauth')}>再編集する</button>
            <button className="btn btn-outline btn-sm" onClick={() => router.push(`/event/${params.eventId}/results`)}>
              集計を見る
            </button>
          </div>
        </div>
      )}

      {mode === 'reauth' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>再編集の認証</h2>

          <div className="field">
            <label>登録時の名前</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="名前を入力"
              maxLength={40}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>パスワード</label>
            <input
              type="password"
              value={editPw}
              onChange={e => setEditPw(e.target.value)}
              placeholder="登録時のパスワード"
            />
          </div>

          {editError && <p className="alert-error" style={{ marginTop: 12 }}>{editError}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-teal" onClick={verifyEdit}>照合して編集する →</button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setMode('form')
                setEditError('')
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {mode === 'grid' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>参加可能な時間帯をドラッグで選択</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>緑 = あなたの選択 / 名前タグ = 他の参加者</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setMySlots(new Set())}>
                  クリア
                </button>
                <button
                  className="btn btn-accent btn-sm"
                  onClick={() => {
                    const all = new Set<string>()
                    event.dates.forEach(d => {
                      const [sh, sm2] = event.start_time.split(':').map(Number)
                      const [eh, em] = event.end_time.split(':').map(Number)
                      let hh = sh
                      let mm = sm2
                      while (hh * 60 + mm < eh * 60 + em) {
                        all.add(`${d}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
                        mm += 30
                        if (mm >= 60) {
                          hh++
                          mm = 0
                        }
                      }
                    })
                    setMySlots(all)
                  }}
                >
                  全選択
                </button>
              </div>
            </div>

            <TimeGrid
              dates={event.dates}
              startTime={event.start_time}
              endTime={event.end_time}
              participants={participants}
              mySlots={mySlots}
              onSlotsChange={setMySlots}
              editable={true}
              myParticipantId={participantId}
            />
          </div>

          <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>
            {saving ? '保存中...' : '登録する ✓'}
          </button>
        </>
      )}
    </div>
  )
}
