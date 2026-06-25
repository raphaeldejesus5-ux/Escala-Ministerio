# 🎵 EscalaMinistério

Sistema web para gestão de escalas de músicos em ministérios de música.

## Stack

- **Frontend:** Next.js 15 (App Router) + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Hospedagem:** Vercel + Supabase (gratuitos)

---

## Configuração local

### 1. Pré-requisitos

- Node.js 18+
- npm ou yarn

### 2. Instalar dependências

```bash
npm install
```

### 3. Variáveis de ambiente

Copie o arquivo de exemplo e preencha com os dados do seu projeto Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tlgarjaymkvrrqorwcyo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Banco de dados

O banco já está configurado no Supabase com 4 migrations aplicadas:

| Migration | Conteúdo |
|-----------|----------|
| `01_types_and_extensions` | Enums e extensões PostgreSQL |
| `02_core_tables` | Tabelas: profiles, events, schedule_slots, unavailabilities, swap_requests, notifications, audit_logs |
| `03_indexes_and_functions` | Índices, triggers, funções de negócio e alertas |
| `04_rls_policies` | Row Level Security — controle de acesso por perfil |

### Funções disponíveis no banco

```sql
-- Verifica disponibilidade de um membro em uma data
SELECT is_member_available('uuid-do-membro', '2025-08-10');

-- Conta serviços nos últimos 30 dias
SELECT count_member_services('uuid-do-membro', 30);

-- Dias desde o último serviço
SELECT days_since_last_service('uuid-do-membro');

-- Sugere bateristas para um evento (retorna ranking por score)
SELECT * FROM suggest_schedule('uuid-do-evento', 'drummer');

-- Gera alertas de sobrecarga e inatividade
SELECT generate_service_alerts();
```

---

## Deploy no Vercel

### 1. Criar repositório no GitHub

```bash
git init
git add .
git commit -m "feat: estrutura inicial EscalaMinistério"
git remote add origin https://github.com/SEU_USUARIO/escala-ministerio.git
git push -u origin main
```

### 2. Importar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório do GitHub
4. Em **"Environment Variables"**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **"Deploy"**

### 3. Configurar URL de redirecionamento no Supabase

No painel do Supabase → Authentication → URL Configuration:

- **Site URL:** `https://seu-projeto.vercel.app`
- **Redirect URLs:** `https://seu-projeto.vercel.app/auth/callback`

---

## Estrutura do projeto

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx       # Tela de login
│   │   ├── register/page.tsx    # Cadastro de usuário
│   │   └── callback/route.ts   # Callback do Supabase Auth
│   ├── dashboard/page.tsx       # Dashboard principal
│   ├── escala/page.tsx          # Lista de eventos e escala
│   ├── integrantes/page.tsx     # Gestão de membros
│   ├── trocas/page.tsx          # Solicitações de troca
│   ├── indisponibilidade/page.tsx # Registrar indisponibilidades
│   ├── notificacoes/page.tsx    # Central de alertas
│   └── relatorios/page.tsx      # Relatórios e gráficos
├── components/
│   ├── ui/                      # Button, Input, Select, Badge, Card, Avatar
│   └── layout/                  # Sidebar, TopBar
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Cliente browser
│   │   └── server.ts            # Cliente server (SSR)
│   └── utils.ts                 # Formatação de datas, classes CSS
├── types/index.ts               # TypeScript types + labels PT-BR
└── middleware.ts                # Proteção de rotas por autenticação
```

---

## Perfis de usuário

| Perfil | Permissões |
|--------|-----------|
| **admin** | Acesso total, incluindo audit logs |
| **leader** | Cria escalas, aprova trocas, vê relatórios |
| **member** | Vê escala, registra indisponibilidade, solicita troca |

Para promover um usuário a líder, execute no Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'leader' WHERE email = 'email@dominio.com';
```

Para promover a admin:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'email@dominio.com';
```

---

## Próximas funcionalidades (roadmap)

- [ ] Cadastro de novo evento com formulário
- [ ] Escalação manual com sugestão automática via `suggest_schedule()`
- [ ] Solicitação de troca com fluxo completo
- [ ] Notificações por e-mail (Resend)
- [ ] Notificações por WhatsApp (Evolution API)
- [ ] Push notifications (Supabase Realtime)
- [ ] 2FA (autenticação em dois fatores)
- [ ] App mobile (Expo / React Native)
- [ ] Edição de perfil
- [ ] Página de admin com gestão de usuários
