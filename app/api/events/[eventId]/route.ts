import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('share_id', params.eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 })
    }

    const { data: participants, error: pErr } = await supabase
      .from('participants')
      .select('id, display_name, slots, created_at, updated_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })

    if (pErr) throw pErr

    return NextResponse.json({ event, participants: participants ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
