import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(
  req: NextRequest,
  { params }: { params: { participantId: string } }
) {
  try {
    const { password, slots } = await req.json()

    const { data: p, error } = await supabase
      .from('participants')
      .select('password_hash')
      .eq('id', params.participantId)
      .single()

    if (error || !p) {
      return NextResponse.json({ error: '参加者が見つかりません' }, { status: 404 })
    }
    if (!p.password_hash) {
      return NextResponse.json({ error: 'パスワードが設定されていないため再編集できません' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, p.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 })
    }

    const { error: updateErr } = await supabase
      .from('participants')
      .update({ slots, updated_at: new Date().toISOString() })
      .eq('id', params.participantId)

    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
