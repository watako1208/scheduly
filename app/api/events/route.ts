import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const shareId = nanoid(10)

    const { error } = await supabase.from('events').insert({
      share_id: shareId,
      title,
      dates,
      start_time: startTime,
      end_time: endTime,
    })

    if (error) throw error

    return NextResponse.json({ shareId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
