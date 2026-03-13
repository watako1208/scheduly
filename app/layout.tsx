import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scheduly — 日程調整',
  description: 'When2meetライクな日程調整サービス',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{
          padding: '14px 24px', background: 'var(--ink)',
          display: 'flex', alignItems: 'center', gap: '12px',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: '"DM Serif Display", serif', fontSize: '22px',
              color: 'var(--paper)', letterSpacing: '-0.5px',
            }}>
              Sched<span style={{ color: 'var(--accent2)', fontStyle: 'italic' }}>uly</span>
            </span>
          </a>
          <span style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 300 }}>
            日程調整をスマートに
          </span>
        </header>
        <main style={{ minHeight: '100dvh', paddingBottom: '64px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
