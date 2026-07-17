-- ============================================================
-- GANHOS BRUTAIS — Migration: cor de identidade da academia
-- Cole no Supabase SQL Editor e clique Run.
-- Pode rodar mesmo que já tenha rodado antes (idempotente).
-- ============================================================

alter table gyms add column if not exists color text default '#3B82F6';

-- Academias já existentes ficam com a cor padrão até você escolher uma nova.
update gyms set color = '#3B82F6' where color is null;
