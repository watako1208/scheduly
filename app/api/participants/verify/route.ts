import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { eventId, displayName, password } = await req.json()

    if (!eventId || !displayName || !password) {
      return NextResponse.json({ error: '入力が不足しています' }, { status: 400 })
    }

    // まずイベントのUUIDを取得
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('share_id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 })
    }

    const { data: participants } = await supabase
      .from('participants')
      .select('id, password_hash, slots')
      .eq('event_id', event.id)
      .eq('display_name', displayName)

    if (!participants?.length) {
      return NextResponse.json({ error: '名前またはパスワードが正しくありません' }, { status: 401 })
    }

    for (const p of participants) {
      if (!p.password_hash) continue
      const ok = await bcrypt.compare(password, p.password_hash)
      if (ok) {
        return NextResponse.json({ participantId: p.id, slots: p.slots })
      }
    }

    return NextResponse.json({ error: '名前またはパスワードが正しくありません' }, { status: 401 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
