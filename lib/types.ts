export interface Event {
  id: string
  share_id: string
  title: string
  dates: string[]
  start_time: string
  end_time: string
  created_at: string
}

export interface Participant {
  id: string
  event_id: string
  display_name: string
  password_hash: string | null
  slots: string[]
  created_at: string
  updated_at: string
}

export interface ParticipantPublic {
  id: string
  display_name: string
  slots: string[]
}
