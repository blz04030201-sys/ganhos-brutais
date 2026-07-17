-- ============================================================
-- GANHOS BRUTAIS — Migration: Cardio Logs
-- Cole no Supabase SQL Editor e clique Run.
-- É seguro rodar mesmo que já tenha rodado antes (idempotente).
-- ============================================================

create table if not exists cardio_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  workout_id  uuid not null references workouts(id)   on delete cascade,
  log_date    date not null,
  type        text not null default 'Personalizado',
  duration    integer not null default 0,   -- minutos
  intensity   text,                          -- texto livre: "Velocidade 6", "Carga 8"...
  distance    numeric(6,2),                  -- km (opcional)
  calories    integer,                       -- kcal (opcional)
  notes       text,                          -- observações (opcional)
  created_at  timestamptz not null default now()
);

-- Índices para as queries mais comuns
create index if not exists cardio_logs_workout_date_idx
  on cardio_logs (workout_id, log_date);

create index if not exists cardio_logs_user_date_idx
  on cardio_logs (user_id, log_date);

-- Row Level Security
alter table cardio_logs enable row level security;

-- Cada usuário só vê e edita seus próprios registros
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cardio_logs' and policyname = 'cardio_logs_owner'
  ) then
    create policy cardio_logs_owner on cardio_logs
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end$$;
