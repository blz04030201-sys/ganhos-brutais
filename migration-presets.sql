-- ============================================================
-- GANHOS BRUTAIS — Migration: biblioteca de Presets de Refeição
-- Cole no Supabase SQL Editor e clique Run.
-- Pode rodar mesmo que já tenha rodado antes (idempotente).
-- ============================================================

create table if not exists meal_presets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  icon        text default '🍽️',
  foods       jsonb not null default '[]'::jsonb,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table meal_presets enable row level security;

drop policy if exists "Own meal presets" on meal_presets;
create policy "Own meal presets" on meal_presets for all using (auth.uid() = user_id);

drop trigger if exists meal_presets_updated_at on meal_presets;
create trigger meal_presets_updated_at before update on meal_presets
  for each row execute procedure update_updated_at();
