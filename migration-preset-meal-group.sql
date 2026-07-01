-- ============================================================
-- GANHOS BRUTAIS — Migration: substituições específicas por refeição
-- Cole no Supabase SQL Editor e clique Run.
-- Pode rodar mesmo que já tenha rodado antes (idempotente).
-- ============================================================

alter table meal_presets
  add column if not exists meal_group text;

-- Pratos existentes (criados antes desta versão) ficam com meal_group NULL,
-- o que significa "compartilhado com todas as refeições" — nada muda para
-- quem já tinha pratos cadastrados. Pratos criados a partir de agora são
-- automaticamente marcados com o grupo da refeição de origem:
--   'breakfast_snack' → Café da manhã / Café da tarde / Lanche
--   'lunch_dinner'    → Almoço / Jantar
-- Outros nomes de refeição não recebem grupo (ficam privados àquela refeição).
