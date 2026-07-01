# Guia de Publicação — Atualização Ganhos Brutais

## 0. Antes de tudo
Faça backup do seu repositório atual (ou garanta que está tudo commitado), depois
extraia o ZIP e substitua os arquivos do seu projeto pelos desta versão.
Nenhum dado do Supabase é apagado por essa atualização — é só código.

## 1. Rodar a migration no Supabase (só isso precisa de SQL nesta leva)
Apenas o item "academia por cor" exige uma coluna nova no banco. Os bugs de
macros foram corrigidos 100% no código, sem precisar tocar no banco.

1. Abra o painel do Supabase → seu projeto → **SQL Editor**.
2. Cole o conteúdo do arquivo `migration-gym-color.sql` (na raiz do projeto).
3. Clique em **Run**. É seguro rodar mais de uma vez (idempotente).

## 2. Instalar e testar localmente (PowerShell)

```powershell
cd caminho\para\ganhos-brutais
npm install
npm run dev
```

Abra o link que aparecer (geralmente `http://localhost:5173`) e confira:
- Dieta: adicione "1 pão francês" e "1 ovo" e veja se os kcal agora batem
  (pão francês ≈150 kcal, ovo ≈72 kcal, não mais 300/143).
- Crie/edite uma academia e escolha uma cor.
- Veja a lista de exercícios mostrando todas as séries do último treino.
- Abra um formulário (ex: novo exercício) com o teclado do celular (ou emulador)
  e confirme que o botão de salvar continua visível.

Quando estiver satisfeito, pare o servidor (`Ctrl+C`).

## 3. Build de produção (opcional, só para conferir antes do deploy)

```powershell
npm run build
npm run preview
```

## 4. Subir para o Git

```powershell
git add .
git commit -m "Correção de macros, melhorias de mobile/UX, cor de academia, hierarquia da dieta"
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

| # | Item do seu documento | Status |
|---|---|---|
| 1 | Hierarquia visual da dieta | ✅ Cartão de refeição redesenhado: cada opção vira um sub-cartão com borda, indentação e macros próprios |
| 2 | Substituições por refeição | ✅ Usa o sistema de "opções" (ex-presets) já existente, relabelado e com visual de hierarquia clara |
| 3 | Macros incorretos | ✅ Corrigido na raiz (conversão unidade↔grama) |
| 4 | Macros zerando | ✅ Recalculo automático ao carregar a tela |
| 5 | Formulários no celular | ✅ Meta viewport `interactive-widget=resizes-content` + reforço de padding |
| 6 | Safe Area | ✅ Buffer mínimo garantido em nav/footer/toast mesmo quando o Android reporta 0 |
| 7 | Última execução antes de registrar | ✅ Mostra todas as séries válidas, não só uma |
| 8 | Cards de exercício menores | ✅ Padding e fontes reduzidos |
| 9 | Academia por cor | ✅ Paleta de 28 cores + migration `migration-gym-color.sql` |
| 10 | Nome curto/completo no treino | ✅ Nome curto grande, completo menor abaixo |
| 11 | Tela inicial — sugestão automática | ✅ Já existia (academia/treino do dia); adicionei um seletor rápido "Trocar" |
| 12 | Revisão geral de UX | ⚠️ Parcial — toquei nos pontos acima; uma varredura completa de espaçamento/animação em todo o app não foi feita nesta leva |

---

## Atualização mais recente (rodada "evolução final")

Nesta rodada **não há nenhuma migration para rodar** — tudo foi feito com as
colunas que já existiam (`sub_name`/`sub_icon` em `meal_items`). Pode ir
direto para `npm install` → `npm run dev` → testar → `git` → `npm run deploy`.

| # | Item do seu documento | Status |
|---|---|---|
| 1 | Remover "Último Treino", enriquecer o card do treino | ✅ As últimas cargas de cada exercício agora aparecem dentro do próprio card "Treino de Hoje" |
| 2 | Hierarquia Refeição → Prato → Ingredientes | ✅ Reaproveitei a estrutura existente (agora chamada "prato" em toda a interface) |
| 3 | Gerenciar pratos (criar/editar/apagar/reordenar/ícone) | ✅ Renomear, excluir, escolher ícone e marcar "⭐ prato principal" direto no card do prato. **Imagem de capa**: implementei como escolha de ícone (emoji), não upload de foto — configurar um bucket de Storage no Supabase é um passo extra que preferi não fazer sem sua confirmação. Me avisa se quiser foto de verdade. |
| 4 | Presets de pratos prontos (Mingau de aveia, Pão com ovo, Crepioca, etc.) | ✅ Adicionados exatamente os exemplos do seu documento (Crepioca, Macarrão à Bolonhesa, Patinho com Arroz, Omelete) |
| 5 | Lista simplificada (Refeição → prato principal) | ✅ O card colapsado da refeição agora mostra só o prato principal, não todos |
| 6/7 | Teclado cobrindo botão Salvar, revisão de navegação | ✅ Reforço adicional: viewport com fallback, campo focado rola pra visão automaticamente, e a tela de fundo trava enquanto um formulário/modal está aberto (evita o "salto" que escondia o botão) |
| 8 | Seção "Minha Dieta" na tela inicial | ✅ Abaixo de "Minhas Academias": refeição → prato principal, sem macros. Toque abre a aba Dieta |
| 9 | Refinamento geral | ⚠️ Parcial — toquei nos pontos acima; não fiz uma varredura de todo o app nesta rodada |

