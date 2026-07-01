# Guia de Publicação — Atualização Ganhos Brutais

## 0. Antes de tudo
Faça backup do seu repositório atual (ou garanta que está tudo commitado), depois
extraia o ZIP e substitua os arquivos do seu projeto pelos desta versão.
Nenhum dado do Supabase é apagado por essa atualização — o app inteiro
continua funcionando com a mesma conta, login e dados salvos.

## 1. Rodar a migration no Supabase
Esta leva adiciona **apenas uma coisa nova ao banco**: a tabela de registros de
hidratação (`water_logs`). Nada existente é alterado ou removido.

1. Abra o painel do Supabase → seu projeto → **SQL Editor**.
2. Cole o conteúdo do arquivo `migration-hydration.sql` (na raiz do projeto).
3. Clique em **Run**. É seguro rodar mais de uma vez (idempotente).

## 2. Instalar e testar localmente (PowerShell)

```powershell
cd caminho\para\ganhos-brutais
npm install
npm run dev
```

Abra o link que aparecer (geralmente `http://localhost:5173`) e confira:
- Tela de Dieta: agora abre com a saudação (Bom dia/Boa tarde/Boa noite + seu
  nome) e o avatar, igual à tela inicial.
- Role até o final da Dieta e veja o card **Hidratação**: toque em +200ml,
  +300ml ou +500ml e veja o total em litros subir. Teste também o campo
  manual em litros (ex: digite `0.7` e toque em "+").
- Confirme que a meta mostrada é `peso x 0.045` litros (ex: 80kg → 3.6L).
- Toque em "Desfazer último" e veja o último registro ser removido.
- Confirme que refeições, metas, macros, treino, corpo e configurações
  continuam funcionando exatamente como antes — nada disso foi alterado.

Quando estiver satisfeito, pare o servidor (`Ctrl+C`).

## 3. Build de produção (opcional, só para conferir antes do deploy)

```powershell
npm run build
npm run preview
```

## 4. Subir para o Git

```powershell
git add .
git commit -m "Polimento da tela de Dieta (saudação) + hidratação em litros (45ml/kg)"
git push
```

## 5. Publicar no GitHub Pages

```powershell
npm run deploy
```

Isso roda `vite build` e publica a pasta `dist` via `gh-pages`. Em 1–2 minutos
o GitHub Pages atualiza a versão publicada.

## 6. Conferir no celular
Abra o app publicado no Android e no iPhone, force um refresh (o Service
Worker do PWA pode cachear a versão antiga por alguns minutos — feche e
reabra o app, ou aguarde a atualização automática do `sw.js`).

---

## O que foi feito nesta leva (resumo técnico)

| # | Item pedido | Status |
|---|---|---|
| 1 | Tela de Dieta mais parecida com a referência enviada | ✅ Adicionada a saudação do topo (Bom dia/Boa tarde/Boa noite, nome + avatar), no mesmo padrão visual já usado na tela inicial. O card de Meta Diária, o donut de Distribuição da Dieta, os Macros Consumidos e a lista de Refeições já seguiam esse padrão e foram mantidos como estavam. |
| 2 | Hidratação por cálculo (45ml x kg corporal) | ✅ Meta calculada automaticamente a partir do peso salvo em Metas. Se o peso não estiver definido, o card avisa para preenchê-lo. |
| 3 | Registro em litros, não em copos | ✅ Removido o conceito de "copos". Registro por botões rápidos (+200ml/+300ml/+500ml) e por campo manual em litros; total e meta sempre exibidos em litros (ex: `2.1 / 3.0 L`). Inclui opção de desfazer o último registro. |
| 4 | Nenhuma funcionalidade existente alterada | ✅ Supabase, GitHub Pages, PWA, autenticação, services/hooks/contexts e toda a arquitetura permanecem exatamente como estavam. A única mudança de banco é a criação da nova tabela `water_logs` (aditiva, não toca em nenhuma tabela existente). |

### Arquivos tocados
- `src/pages/DietScreen.jsx` — saudação no topo + novo card de Hidratação.
- `src/services/diet.js` — novo `hydrationService` (mesmo padrão dos outros services).
- `migration-hydration.sql` — novo, cria a tabela `water_logs` com RLS.

Nenhum outro arquivo (`.git`, `.env`, `node_modules`, schema existente, demais
telas, services, hooks ou contexts) foi modificado.
