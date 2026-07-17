# Guia de Publicação — Atualização Ganhos Brutais

## 0. Antes de tudo
Faça backup do seu repositório atual (ou garanta que está tudo commitado), depois
extraia o ZIP e substitua os arquivos do seu projeto pelos desta versão.
Nenhum dado do Supabase é apagado por essa atualização — o app inteiro
continua funcionando com a mesma conta, login e dados salvos.

## 1. Rodar a migration no Supabase
Esta leva adiciona **apenas uma coisa nova ao banco**: a tabela de registros de
hidratação (`water_logs`). O polimento visual desta rodada (Dieta mais
compacta + exercícios do treino mais compactos) é só CSS/layout — não precisa
de nenhuma migration nova.

1. Abra o painel do Supabase → seu projeto → **SQL Editor**.
2. Cole o conteúdo do arquivo `migration-hydration.sql` (na raiz do projeto).
3. Clique em **Run**. É seguro rodar mais de uma vez (idempotente). Se você já
   rodou essa migration numa versão anterior, pode pular este passo.

## 2. Instalar e testar localmente (PowerShell)

```powershell
cd caminho\para\ganhos-brutais
npm install
npm run dev
```

Abra o link que aparecer (geralmente `http://localhost:5173`) e confira:
- Tela de Dieta: abre com a saudação (Bom dia/Boa tarde/Boa noite + nome) e o
  avatar, e agora exige bem menos rolagem para ver tudo — Meta Diária,
  Distribuição, Macros Consumidos, Refeições e Hidratação, todos mais
  enxutos, com as mesmas informações de antes.
- Card de Hidratação: +200ml/+300ml/+500ml e o campo manual em litros
  continuam funcionando, meta = peso × 0.045L.
- Treino → abra um treino e veja a lista de exercícios: cada exercício
  continua mostrando nome, séries válidas, últimas cargas, PR e os botões de
  Histórico/Registrar/Editar/Excluir — só ocupando menos altura na tela.
- Confirme que reordenar (arrastar), editar, excluir, registrar série e ver
  histórico de exercício continuam idênticos a antes.
- Confirme que refeições, metas, corpo e configurações continuam funcionando
  exatamente como antes.

Quando estiver satisfeito, pare o servidor (`Ctrl+C`).

## 3. Build de produção (opcional, só para conferir antes do deploy)

```powershell
npm run build
npm run preview
```

## 4. Subir para o Git

```powershell
git add .
git commit -m "Polimento visual: Dieta e exercícios do treino mais compactos (sem alterar funcionalidades)"
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
| 1 | Tela de Dieta ocupando menos altura, sem remover informações | ✅ Saudação do topo e cabeçalho unidos em um bloco mais compacto; paddings, gaps e fontes dos 3 cards de macro (Meta Diária, Distribuição, Macros Consumidos) reduzidos; o "g/kg" de cada macro foi movido para a mesma linha da porcentagem (economiza uma linha por macro, sem perder o dado); cards de refeição e o card de Hidratação com paddings/ícones menores. |
| 2 | Exercícios do treino ocupando menos altura | ✅ Cabeçalho, espaçamento entre cards e o card de cada exercício (nome, séries válidas, últimas cargas, PR, ações) reduzidos, mesma informação. |
| 3 | Nenhuma funcionalidade, cálculo ou arquitetura alterada | ✅ Supabase, GitHub Pages, PWA, autenticação, services/hooks/contexts, estrutura do banco e toda a lógica de cálculo permanecem exatamente como estavam — só CSS/layout (paddings, tamanhos de fonte, espaçamentos) foi ajustado. |

### Arquivos tocados nesta rodada
- `src/pages/DietScreen.jsx` — reorganização visual mais compacta.
- `src/pages/WorkoutsScreen.jsx` — lista de exercícios mais compacta.

Nenhum outro arquivo (`.git`, `.env`, `node_modules`, schema/migrations,
demais telas, services, hooks ou contexts) foi modificado nesta rodada.
