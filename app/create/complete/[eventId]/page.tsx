'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'

export default function CompletePage({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const [eventTitle, setEventTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${params.eventId}`
    : ''

  useEffect(() => {
    fetch(`/api/events/${params.eventId}`)
      .then(r => r.json())
      .then(d => { if (d.event) setEventTitle(d.event.title) })
  }, [params.eventId])

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qrcode.png'
    a.click()
  }

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 24px 64px' }}>
      <h1 style={{ fontSize:'2rem', marginBottom:8 }}>作成完了！</h1>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:32 }}>以下のURLを参加者に共有してください</p>

      <div className="card" style={{ marginBottom:20 }}>
        {eventTitle && (
          <div style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.2rem', marginBottom:16 }}>{eventTitle}</div>
        )}
        <label style={{ display:'block', fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>共有URL</label>
        <div style={{ background:'var(--cream)', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', padding:'12px 16px', fontSize:14, wordBreak:'break-all', fontFamily:'monospace', marginBottom:12 }}>
          {shareUrl}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-accent" onClick={copyUrl}>
            {copied ? '✓ コピーしました！' : '📋 URLをコピー'}
          </button>
          <button className="btn btn-outline" onClick={() => router.push(`/event/${params.eventId}`)}>
            参加者として登録する
          </button>
          <button className="btn btn-outline" onClick={() => router.push(`/event/${params.eventId}/results`)}>
            集計を見る
          </button>
        </div>
      </div>

      <div className="card" style={{ textAlign:'center' }}>
        <h2 style={{ marginBottom:4 }}>QRコード</h2>
        <p style={{ color:'var(--muted)', fontSize:14, marginBottom:16 }}>スマートフォンで読み取れます</p>
        <div ref={qrRef} style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          {shareUrl && (
            <QRCodeCanvas
              value={shareUrl}
              size={200}
              fgColor="#1a1a2e"
              bgColor="#ffffff"
              level="M"
            />
          )}
        </div>
        <button className="btn btn-teal" onClick={downloadQR}>⬇ QRコードを保存</button>
      </div>
    </div>
  )
}
