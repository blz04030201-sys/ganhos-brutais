# 💪 Ganhos Brutais

App profissional de treino e dieta com sincronização em nuvem, login real e PWA instalável.

**Stack:** React 18 + Vite · Supabase (Auth + PostgreSQL) · GitHub Pages

---

## 🚀 Deploy em 10 passos

### 1. Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repo: `ganhos-brutais` *(ou outro nome)*
3. Deixe **público** (necessário para GitHub Pages grátis)
4. Clique em **Create repository**

---

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Escolha um nome (ex: `ganhos-brutais`) e senha do banco
3. Aguarde o projeto iniciar (~2 min)
4. Vá em **SQL Editor → New Query**
5. Cole todo o conteúdo de `schema.sql` e clique **Run**
6. Vá em **Project Settings → API**
7. Copie:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → chave longa começando com `eyJ...`

> ⚠️ Ative a confirmação de e-mail em **Authentication → Email** se quiser exigir verificação.

---

### 3. Configurar variáveis de ambiente

Na raiz do projeto, crie o arquivo `.env`:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

---

### 4. Ajustar o nome do repositório

Se o seu repositório **não se chama** `ganhos-brutais`, edite `vite.config.js`:

```js
base: '/SEU_REPO_AQUI/',
```

E em `src/services/auth.js`, linha `resetPassword`:

```js
const redirectTo = `${window.location.origin}/SEU_REPO_AQUI/`
```

---

### 5. Instalar dependências e testar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173/ganhos-brutais/`

---

### 6. Adicionar ícones PWA

1. Execute `node generate-icons.mjs`
2. Converta `public/icons/icon.svg` para PNG em [svgtopng.com](https://svgtopng.com)
3. Salve como:
   - `public/icons/icon-192.png` (192×192)
   - `public/icons/icon-512.png` (512×512)

Ou use qualquer imagem PNG que você preferir.

---

### 7. Build e deploy

```bash
# Instale o gh-pages se ainda não tiver
npm install

# Build + deploy automático
npm run deploy
```

Isso roda `npm run build` e publica a pasta `dist/` no branch `gh-pages`.

---

### 8. Ativar GitHub Pages

1. No repositório, vá em **Settings → Pages**
2. Em **Source**, selecione: `Branch: gh-pages` / `Folder: / (root)`
3. Clique **Save**
4. Aguarde ~1 min. O app estará em: `https://SEU_USUARIO.github.io/ganhos-brutais/`

---

### 9. Configurar URL de redirect no Supabase

1. Vá em **Authentication → URL Configuration**
2. Em **Site URL**: `https://SEU_USUARIO.github.io/ganhos-brutais/`
3. Em **Redirect URLs**, adicione:
   - `https://SEU_USUARIO.github.io/ganhos-brutais/`
   - `http://localhost:5173/ganhos-brutais/`

---

### 10. Instalar como PWA (celular)

**Android (Chrome):**
- Abra o app → menu ⋮ → "Adicionar à tela inicial"

**iPhone (Safari):**
- Abra o app → botão compartilhar → "Adicionar à Tela de Início"

---

## 🗂️ Estrutura do projeto

```
ganhos-brutais/
├── public/
│   └── icons/          ← ícones PWA (192.png, 512.png)
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   └── UI.jsx      ← Modal, Toast, MacroRing, etc.
│   ├── hooks/
│   │   └── useAppContext.jsx
│   ├── pages/
│   │   ├── AuthScreen.jsx
│   │   ├── DashboardScreen.jsx
│   │   ├── WorkoutsScreen.jsx
│   │   ├── DietScreen.jsx
│   │   ├── BodyScreen.jsx
│   │   └── SettingsScreen.jsx
│   ├── services/
│   │   ├── supabase.js   ← client Supabase
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── workouts.js
│   │   └── diet.js
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   ├── foodsDb.js    ← banco de alimentos
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── schema.sql            ← rode no Supabase SQL Editor
├── vite.config.js
├── package.json
└── .env                  ← crie com suas keys (não commitar!)
```

---

## ✨ Funcionalidades

| Módulo | O que tem |
|--------|-----------|
| **Auth** | Cadastro, login, logout, recuperação de senha, sessão persistente |
| **Treinos** | Academias → Treinos → Exercícios → Registro de séries com kg e reps |
| **Histórico** | Histórico completo por exercício, detecção de PR automática, volume total |
| **Dieta** | Refeições com alimentos, banco de 100+ alimentos, presets, substituições |
| **Macros** | Calorias, proteínas, carboidratos e gorduras com metas personalizáveis |
| **Corpo** | Registro de peso, % gordura e medidas com gráfico de evolução |
| **Dashboard** | Resumo do dia, gráfico de peso, frase motivacional |
| **Configurações** | Perfil, objetivo, cor de destaque do app, trocar senha |
| **Sincronização** | Dados em nuvem — acesse de qualquer dispositivo após login |
| **PWA** | Instalável como app nativo no celular, funciona offline (cache) |

---

## 🛠️ Comandos

```bash
npm run dev      # servidor local
npm run build    # build de produção
npm run preview  # preview do build
npm run deploy   # build + publish no GitHub Pages
```

---

## 🔒 Segurança

- Todas as tabelas têm **Row Level Security (RLS)** ativado
- Cada usuário acessa **apenas seus próprios dados**
- A `anon key` é segura de expor no frontend (ela não tem permissões de admin)
- Nunca commite o arquivo `.env` (está no `.gitignore`)

---

## 📦 Atualizações futuras

Para atualizar o app depois de alterações:

```bash
npm run deploy
```

O GitHub Pages atualiza automaticamente em ~1 minuto.
