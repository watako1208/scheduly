import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  noStore()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('share_id', params.eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ event: null, participants: [] }, { status: 404 })
  }

  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('id, display_name, slots, created_at, updated_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true })

  if (participantsError) {
    return NextResponse.json(
      { event, participants: [], error: participantsError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    event,
    participants: participants ?? [],
  })
}
