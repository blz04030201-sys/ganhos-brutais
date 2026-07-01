-- ============================================================
-- GANHOS BRUTAIS — Migration: Hidratação (registro em litros)
-- Cole no Supabase SQL Editor e clique Run.
-- Pode rodar mesmo que já tenha rodado antes (idempotente).
-- ============================================================

create table if not exists water_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  date        date not null default current_date,
  amount_ml   numeric(6,0) not null default 0,
  created_at  timestamptz default now()
);

create index if not exists water_logs_user_date_idx on water_logs (user_id, date);

alter table water_logs enable row level security;

drop policy if exists "Own water logs" on water_logs;
create policy "Own water logs" on water_logs for all using (auth.uid() = user_id);
