-- ============================================================
-- GANHOS BRUTAIS — Migration: Cardio v2 (referência fixa por treino)
-- Cole no Supabase SQL Editor e clique Run.
-- Seguro rodar mesmo que já tenha rodado antes (idempotente).
--
-- O que muda em relação à v1 (migration-cardio.sql):
--   • Cardio deixa de ser um registro solto por data e passa a ter
--     uma "referência" fixa por treino (cardio_configs) — criada na
--     aba do treino, igual a um exercício.
--   • cardio_logs passa a apontar para essa referência
--     (cardio_config_id) e guarda o que foi feito em cada data,
--     podendo divergir da referência (tempo/intensidade ajustados
--     naquele dia).
--   • Registros antigos (v1) são migrados automaticamente: uma
--     referência é criada para cada combinação treino+tipo já usada,
--     e os logs existentes são religados a ela. Nada é apagado.
-- ============================================================

-- 1) Referência de cardio por treino (criada/editada na aba do treino)
create table if not exists cardio_configs (
  id            uuid primary key default gen_random_uuid(),
  workout_id    uuid not null references workouts(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null default 'Personalizado',
  duration_min  integer,
  intensity     text,
  distance_km   numeric(6,2),
  calories      integer,
  notes         text,
  position      text not null default 'depois' check (position in ('antes','depois')),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists cardio_configs_workout_idx on cardio_configs(workout_id, position, sort_order);
create index if not exists cardio_configs_user_idx    on cardio_configs(user_id);

alter table cardio_configs enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'cardio_configs' and policyname = 'cardio_configs_owner') then
    create policy cardio_configs_owner on cardio_configs
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end$$;

-- 2) cardio_logs passa a se referir a uma cardio_config (o "registro do dia")
alter table cardio_logs add column if not exists cardio_config_id uuid references cardio_configs(id) on delete cascade;

create index if not exists cardio_logs_config_date_idx on cardio_logs(cardio_config_id, log_date desc);

-- Observação: a unicidade "uma referência tem no máximo um registro por
-- data" é garantida pelo próprio app (ele busca o registro do dia antes
-- de salvar). Não usamos uma constraint UNIQUE aqui de propósito, para
-- não travar a migração caso existam registros duplicados vindos da v1.

-- 3) Backfill: cria uma referência para cada treino+tipo que já tinha
--    cardio registrado no modelo antigo (v1), e religa os logs a ela.
do $$
declare
  r record;
  new_cfg_id uuid;
begin
  for r in
    select distinct workout_id, user_id, type
    from cardio_logs
    where cardio_config_id is null
  loop
    insert into cardio_configs (workout_id, user_id, type, position, sort_order)
    values (r.workout_id, r.user_id, r.type, 'depois', 0)
    returning id into new_cfg_id;

    update cardio_logs
      set cardio_config_id = new_cfg_id
      where workout_id = r.workout_id
        and user_id = r.user_id
        and type = r.type
        and cardio_config_id is null;
  end loop;
end$$;
