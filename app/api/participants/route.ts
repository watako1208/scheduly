import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { eventId, displayName, password, slots } = await req.json()

    if (!eventId || !displayName) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const { data, error } = await supabase
      .from('participants')
      .insert({
        event_id: eventId,
        display_name: displayName,
        password_hash: passwordHash,
        slots: slots ?? [],
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ participantId: data.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
