import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function nanoid(n = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const arr = new Uint8Array(n)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { title, dates, startTime, endTime } = await req.json()

    if (!title || !dates?.length || !startTime || !endTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: '終了時刻は開始時刻より後にしてください' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: 'Supabase の環境変数が Vercel に設定されていません',
          detail: {
            hasUrl: Boolean(supabaseUrl),
            hasAnonKey: Boolean(supabaseAnonKey),
          },
        },
        { status: 500 }
      )
    }

    const shareId = nanoid(10)

    const { error } = await supabase.from('events').insert({
      share_id: shareId,
      title,
      dates,
      start_time: startTime,
      end_time: endTime,
    })

    if (error) {
      return NextResponse.json(
        {
          error: 'イベントを保存できませんでした',
          detail: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ shareId })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)

    return NextResponse.json(
      {
        error: 'サーバーエラーが発生しました',
        detail: message,
      },
      { status: 500 }
    )
  }
}