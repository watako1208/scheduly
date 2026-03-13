-- Scheduly テーブル定義
-- Supabase の SQL Editor に貼り付けて実行してください

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  share_id     text unique not null,
  title        text not null,
  dates        date[] not null,
  start_time   time not null,
  end_time     time not null,
  created_at   timestamptz default now()
);

create table if not exists participants (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references events(id) on delete cascade,
  display_name    text not null,
  password_hash   text,
  slots           text[] not null default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- インデックス
create index if not exists idx_events_share_id on events(share_id);
create index if not exists idx_participants_event_id on participants(event_id);

-- RLS（Row Level Security）を有効化
alter table events enable row level security;
alter table participants enable row level security;

-- 全員が読み書きできるポリシー（認証なしで使うため）
create policy "events_all" on events for all using (true) with check (true);
create policy "participants_all" on participants for all using (true) with check (true);
