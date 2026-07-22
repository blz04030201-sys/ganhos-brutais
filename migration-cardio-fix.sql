-- ============================================================
-- GANHOS BRUTAIS — Correção: colunas faltando em cardio_logs
-- Cole no Supabase SQL Editor e clique Run.
-- Seguro rodar mesmo que já tenha rodado antes (idempotente).
--
-- O que houve: a tabela cardio_logs foi criada originalmente por uma
-- versão anterior do app, com nomes de coluna diferentes dos que o
-- código atual usa (ex.: "duration"/"distance" em vez de
-- "duration_min"/"distance_km"). A migração v2 só adicionou a coluna
-- cardio_config_id e assumiu que as demais já existiam com os nomes
-- certos — por isso o app não conseguia salvar ("Could not find the
-- 'distance_km' column..."). Este script garante que todas as colunas
-- que o app realmente usa existam, sem apagar nada que já está lá.
-- ============================================================

alter table cardio_logs add column if not exists cardio_config_id uuid references cardio_configs(id) on delete cascade;
alter table cardio_logs add column if not exists type          text;
alter table cardio_logs add column if not exists duration_min  integer;
alter table cardio_logs add column if not exists intensity     text;
alter table cardio_logs add column if not exists distance_km   numeric(6,2);
alter table cardio_logs add column if not exists calories      integer;
alter table cardio_logs add column if not exists notes         text;
alter table cardio_logs add column if not exists log_date      date;
alter table cardio_logs add column if not exists user_id       uuid references profiles(id) on delete cascade;
alter table cardio_logs add column if not exists created_at    timestamptz default now();

create index if not exists idx_cardio_logs_config_date on cardio_logs(cardio_config_id, log_date desc);

-- Garante RLS e a policy correta (idempotente)
alter table cardio_logs enable row level security;
drop policy if exists "Own cardio logs" on cardio_logs;
create policy "Own cardio logs" on cardio_logs for all using (auth.uid() = user_id);
