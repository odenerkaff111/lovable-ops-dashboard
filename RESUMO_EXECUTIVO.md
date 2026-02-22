# 🎯 Dashboard Comercial - Resumo Executivo

## O que foi entregue

Você agora tem um **Dashboard Comercial Gamificado completo** pronto para receber dados via webhooks do n8n.

### 📦 Arquivos Criados/Atualizados

#### 1. **Banco de Dados**
- ✅ `SUPABASE_SCHEMA.sql` - Schema completo com tabelas, índices e RLS
  - profiles (usuários)
  - task_types (tipos de tarefas)
  - daily_goals (metas)
  - activity_logs (log imutável)
  - appointments (agendamentos)
  - webhook_logs (auditoria)

#### 2. **Backend de Webhooks**
- ✅ `webhook-server.ts` - Servidor Express Node.js
  - POST /api/activity
  - POST /api/agendamento
  - POST /api/call-status
  - GET /health

- ✅ `vercel-api-examples.ts` - Alternativa para deploy em Vercel
  
- ✅ `src/lib/api-webhooks.ts` - Funções auxiliares

#### 3. **Frontend - React Components**
- ✅ `AppointmentCardInteractive.tsx` - Cards com botões de status
- ✅ `useDashboardDataRealtime.ts` - Hook com atualizações tempo real

#### 4. **Documentação**
- ✅ `IMPLEMENTATION_GUIDE.md` - Guia completo passo a passo
- ✅ `README_PT-BR.md` - README em português
- ✅ `.env.example` - Template de variáveis de ambiente

#### 5. **Testes**
- ✅ `test-webhooks.ts` - Suite de testes para validar webhooks

---

## 🚀 Como Usar

### Passo 1: Configurar Banco de Dados (5 min)

1. Vá para https://app.supabase.com → Seu Projeto
2. Abra: SQL Editor → New Query
3. Cole todo o conteúdo de `SUPABASE_SCHEMA.sql`
4. Clique em "Run"

**✅ Pronto!** Banco de dados está criado.

### Passo 2: Iniciar Frontend (1 min)

```bash
cd lovable-ops-dashboard
npm install  # Já tem as dependências
npm run dev
```

Acesse: **http://localhost:8081** (ou a porta que aparecer no terminal)

### Passo 3: Criar Conta e Dados (2 min)

1. Clique em "Não tem conta? Criar agora"
2. Crie sua primeira conta
3. Vá para `/admin` (seu usuário é admin por padrão)
4. Crie mais usuários (você e sua esposa, por exemplo)
5. Configure metas diárias para cada um

### Passo 4: Testar Webhooks Localmente (5 min - Opcional)

```bash
# Terminal 2
npm install express cors dotenv @supabase/supabase-js
npx ts-node webhook-server.ts

# Terminal 3
npx ts-node test-webhooks.ts
```

### Passo 5: Integrar com n8n (10 min)

No n8n, crie workflows que façam POST para seu servidor:

**Quando novo lead é criado:**
```
POST http://seu-servidor:3001/api/activity
Authorization: Bearer SEU_TOKEN_SECRETO
Body: {
  "user_id": "uuid-do-usuario",
  "tipo_acao": "lead_criado",
  "lead_id": "id-do-lead",
  "timestamp": "2024-02-21T10:30:00Z"
}
```

**Quando lead vai para agendamento:**
```
POST http://seu-servidor:3001/api/agendamento
Authorization: Bearer SEU_TOKEN_SECRETO
Body: {
  "lead_id": "id-do-lead",
  "nome": "João Silva",
  "data_agendada": "2024-02-22T14:00:00Z",
  "user_responsavel": "uuid-do-usuario"
}
```

**Após chamada de vendas:**
```
POST http://seu-servidor:3001/api/call-status
Authorization: Bearer SEU_TOKEN_SECRETO
Body: {
  "lead_id": "id-do-lead",
  "status": "venda_realizada"
}
```

---

## 📊 Estrutura de Dados

### Usuários (profiles)
```
id: UUID
email: string (único)
full_name: string
role: 'admin' | 'sdr' | 'closer' | 'social_seller'
active: boolean
```

### Tipos de Tarefas (task_types)
- ✅ lead_criado
- ✅ lead_engajado
- ✅ follow_up

### Metas (daily_goals)
```
user_id: UUID
task_type_id: UUID
goal_value: number (ex: 50)
goal_date: date
```

### Atividades (activity_logs) - Imutável
```
user_id: UUID
action_type: string
lead_id: string
timestamp: datetime
metadata: JSON
```

### Agendamentos (appointments)
```
lead_id: string (único)
lead_name: string
assigned_user_id: UUID
scheduled_date: datetime
status: 'pendente' | 'no_show' | 'venda_realizada' | 'venda_nao_realizada'
```

---

## 🎮 Gamificação

As mensagens mudam conforme a meta é batida:

```
Sua meta: 50 leads

0 → 20   (0-40%)   : "Bora bater os primeiros, campeão."
20 → 40  (40-80%)  : "Boa vencedor, é isso. Vamo chegar lá!"
40 → 50  (80-100%) : "Representou demais... já tá quase!"
50+      (100%+)   : "Booooa caralho, conseguiu mais uma vez. Ou dá desculpa ou dá resultado. Parabéns!"
```

---

## 📈 Dashboard Mostra

### Métricas Individuais (por usuário)
- Leads criados hoje
- Leads engajados hoje
- Follow ups hoje
- Barra de progresso com % da meta
- Mensagem gamificada

### Métricas Gerais (todos usuários)
- Total de leads criados
- Total engajados
- Total follow ups
- Leads em agendamento
- Calls agendadas hoje
- Calls realizadas
- Taxa de no-show %
- Taxa de conversão %

### Agendamentos
- Lista de todos os agendamentos pendentes
- Botões interativos: Venda | No Show | Não Realizada
- Filtro por período (hoje, semana, mês)

---

## 🔐 Segurança

✅ Autenticação Supabase Auth  
✅ Row Level Security (RLS) nas tabelas  
✅ Validação de webhook token  
✅ Log de todas as chamadas  
✅ Sem acesso anônimo  
✅ Senhas criptografadas  

---

## 🌐 Deploy em Produção

### Opção 1: Vercel (Mais Fácil)

```bash
npm install -g vercel
vercel
```

### Opção 2: Railway.app

1. Conectar GitHub
2. Adicionar variáveis de ambiente
3. Deploy automático

### Opção 3: Render.com

Similar ao Railway.

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Supabase (já preenchido)
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave
VITE_SUPABASE_URL=sua_url

# Webhook
VITE_WEBHOOK_SECRET=seu_token_super_secreto_123
VITE_API_BASE_URL=http://localhost:3001 (ou sua URL em produção)

# Servidor Backend
PORT=3001
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

---

## 🧪 Testando

### Teste local de webhook:

```bash
curl -X POST http://localhost:3001/api/activity \
  -H "Authorization: Bearer seu_token_secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-uuid-aqui",
    "tipo_acao": "lead_criado",
    "lead_id": "TEST_001"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Atividade registrada com sucesso"
}
```

---

## 📁 Arquivos Principais

```
lovable-ops-dashboard/
├── src/
│   ├── pages/
│   │   ├── Login.tsx          ✅ Autenticação
│   │   ├── Dashboard.tsx       ✅ Dashboard principal
│   │   └── Admin.tsx           ✅ Painel admin
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── GamifiedProgressBar.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── AppointmentCardInteractive.tsx ✨ NOVO
│   │   │   ├── UserPerformanceCard.tsx
│   │   │   └── StatCard.tsx
│   ├── hooks/
│   │   ├── useDashboardData.ts
│   │   └── useDashboardDataRealtime.ts ✨ NOVO (tempo real)
│   ├── lib/
│   │   ├── api-webhooks.ts ✨ NOVO
│   │   └── supabase-helpers.ts
│   └── contexts/
│       └── AuthContext.tsx
├── webhook-server.ts ✨ NOVO
├── test-webhooks.ts ✨ NOVO
├── SUPABASE_SCHEMA.sql ✨ NOVO
├── IMPLEMENTATION_GUIDE.md ✨ NOVO
├── README_PT-BR.md ✨ NOVO
├── .env.example ✨ NOVO
└── package.json
```

---

## 🎯 Próximos Passos Recomendados

1. **Executar SQL** no Supabase (SUPABASE_SCHEMA.sql)
2. **Rodar frontend** (`npm run dev`)
3. **Criar conta** e fazer login
4. **Criar usuários** no admin
5. **Configurar metas** diárias
6. **Testar webhooks** localmente (com `test-webhooks.ts`)
7. **Integrar com n8n** seus workflows
8. **Deploy em produção** (Vercel/Railway/Render)

---

## 💡 Fluxo Automático Esperado

```
Seu CRM (Krayin)
    ↓ (Evento: novo lead)
n8n Workflow
    ↓ POST /api/activity
webhook-server.ts
    ↓ Valida token & insere
Supabase (activity_logs)
    ↓ Realtime subscription
Frontend Dashboard
    ↓ Atualiza em tempo real
Você vê: "1/50 leads criados ✓"
```

---

## ❓ FAQ

**P: Por onde começo?**
R: Execute o SQL no Supabase, depois rode `npm run dev`

**P: Como integro com meu Krayin CRM?**
R: Use n8n para detectar eventos e fazer POST nos endpoints

**P: Qual o token para os webhooks?**
R: Configure `VITE_WEBHOOK_SECRET` no `.env`

**P: Funciona em produção?**
R: Sim, deploy com Vercel/Railway/Render

**P: Atualiza em tempo real?**
R: Sim, via Supabase Realtime subscriptions

---

## 🚨 Troubleshooting

**Problema:** Webhook não recebe dados
- Verifique: `curl http://localhost:3001/health`
- Verifique token em `.env`

**Problema:** Dashboard não atualiza
- Abra DevTools → Console (procure por erros)
- Verifique RLS policies no Supabase

**Problema:** Não consigo fazer login
- Crie uma nova conta
- Verifique se Supabase está online

---

## 📞 Suporte

Dúvidas? Abra uma issue no GitHub!

---

**Data**: 21/02/2026  
**Stack**: React 18 + TypeScript + Tailwind CSS + Supabase + n8n  
**Versão**: 1.0.0
