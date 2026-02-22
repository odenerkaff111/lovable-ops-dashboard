# Dashboard Comercial Gamificado

Sistema de controle de performance operacional diária com integração via webhooks n8n. Perfeito para times comerciais com SDRs, Closers e Social Sellers.

## ✨ Features

- ✅ **Autenticação Multi-usuário** - Login seguro com Supabase
- ✅ **Painel Admin** - Gerenciamento de usuários e metas
- ✅ **Webhooks n8n** - Integração automática de dados
- ✅ **Dashboard em Tempo Real** - Atualizações live via subscriptions
- ✅ **Gamificação** - Mensagens motivacionais baseadas em meta
- ✅ **Agendamentos Interativos** - Registro de calls com status
- ✅ **Múltiplos Períodos** - Hoje, semana, mês, personalizado
- ✅ **Métricas Completas** - Individual e geral
- ✅ **Design SaaS Moderno** - Interface limpa e intuitiva

## 🚀 Início Rápido

### 1. Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/odenerkaff111/lovable-ops-dashboard.git
cd lovable-ops-dashboard

# Instale dependências
npm install
```

### 2. Configure Banco de Dados

Execute o SQL no Supabase:
1. Vá para: https://app.supabase.com → Seu Projeto
2. SQL Editor → New Query
3. Cole o conteúdo de `SUPABASE_SCHEMA.sql`
4. Execute (Run)

### 3. Configure Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# As variáveis do Supabase já estão preenchidas
# Você só precisa adicionar o WEBHOOK_SECRET
VITE_WEBHOOK_SECRET="seu_token_super_secreto_aqui_123456"
```

### 4. Inicie o Frontend

```bash
npm run dev
# Abra: http://localhost:5173
```

### 5. Configure o Backend de Webhooks (Opcional, para testes locais)

```bash
# Instale dependências para o webhook-server
npm install express cors dotenv @supabase/supabase-js

# Em outro terminal
npx ts-node webhook-server.ts
# Deve exibir: 🚀 Servidor de webhooks rodando na porta 3001
```

## 📊 Arquitetura

```
┌─────────────────────────────────────────┐
│         n8n Workflow                    │
│  (Seu CRM enviando dados)               │
└──────────────────┬──────────────────────┘
                   │ POST /api/activity
                   │ POST /api/agendamento
                   │ POST /api/call-status
                   ▼
┌─────────────────────────────────────────┐
│    Backend de Webhooks                  │
│  (webhook-server.ts ou Vercel)          │
└──────────────────┬──────────────────────┘
                   │ Valida token
                   │ Insere em Supabase
                   ▼
┌─────────────────────────────────────────┐
│      Supabase Database                  │
│  activity_logs, appointments,           │
│  profiles, daily_goals, task_types      │
└──────────────────┬──────────────────────┘
                   │ Realtime Subscriptions
                   ▼
┌─────────────────────────────────────────┐
│    Frontend React (Dashboard)           │
│  - Atualização em tempo real            │
│  - Gamificação e métricas               │
│  - Admin panel                          │
└─────────────────────────────────────────┘
```

## 🔧 Configuração Detalhada

### Passo 1: Supabase

**Schema criado automaticamente:**
- `profiles` - Usuários (id, email, full_name, role, active)
- `task_types` - Tipos: lead_criado, lead_engajado, follow_up
- `daily_goals` - Metas diárias por usuário
- `activity_logs` - Log imutável de ações
- `appointments` - Agendamentos com status
- `webhook_logs` - Auditoria de webhooks

### Passo 2: Usar o Dashboard

1. **Login**: Acesse http://localhost:5173/login
   - Crie uma conta ou login

2. **Admin Panel**: Vá para `/admin`
   - Crie novos usuários
   - Configure metas diárias
   - Ative/desative usuários

3. **Dashboard**: Vá para `/`
   - Veja métricas em tempo real
   - Gerencie agendamentos
   - Filtre por período

### Passo 3: Integrar com n8n

No n8n, crie workflows que façam POST para:

**POST /api/activity**
```json
{
  "user_id": "uuid-do-usuario",
  "tipo_acao": "lead_criado",
  "lead_id": "id-do-lead",
  "timestamp": "2024-02-21T10:30:00Z",
  "metadata": {"source": "instagram"}
}
```

**POST /api/agendamento**
```json
{
  "lead_id": "id-do-lead",
  "nome": "João Silva",
  "data_agendada": "2024-02-22T14:00:00Z",
  "user_responsavel": "uuid-do-usuario"
}
```

**POST /api/call-status**
```json
{
  "lead_id": "id-do-lead",
  "status": "venda_realizada",
  "metadata": {"valor": 5000}
}
```

## 📖 Documentação Completa

Para instruções mais detalhadas, veja:
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Guia passo a passo
- [SUPABASE_SCHEMA.sql](./SUPABASE_SCHEMA.sql) - Schema do banco

## 🌐 Deploy em Produção

### Opção 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Configurar variáveis de ambiente no Vercel dashboard.

### Opção 2: Railway.app

1. Conectar repositório GitHub
2. Adicionar variáveis de ambiente
3. Deploy automático

### Opção 3: Render.com

Muito similar ao Railway.

## 📱 Funcionalidades Principais

### Dashboard

**Métrica Geral:**
- Total de Leads Criados
- Total Engajados
- Total Follow Ups
- Leads em Agendamento
- Calls Agendadas
- Calls Realizadas
- Taxa No-Show %
- Taxa Conversão %

**Por Usuário:**
- Leads criados hoje
- Leads engajados hoje
- Follow ups realizados hoje
- Barra de progresso com gamificação

### Agendamentos

- Lista interativa de agendamentos
- Botões de ação: Venda, No Show, Não Realizada
- Atualização automática de status
- Filtro por período

### Admin

- Criar usuários
- Definir roles (SDR, Closer, Social Seller, etc)
- Configurar metas diárias
- Ativar/desativar usuários

## 🎮 Gamificação

Mensagens motivacionais por percentual da meta:

```
0-40%:   "Bora bater os primeiros, campeão."
40-80%:  "Boa vencedor, é isso. Vamo chegar lá!"
80-100%: "Representou demais... já tá quase!"
100%+:   "Booooa caralho, conseguiu mais uma vez. Ou dá desculpa ou dá resultado. Parabéns!"
```

## 🔒 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) nas tabelas
- ✅ Validação de webhook token
- ✅ Log de todas as chamadas
- ✅ Sem acesso anônimo
- ✅ Senhas criptografadas

## 🆘 Troubleshooting

### Webhook não recebe dados?

1. Verifique se webhook-server está rodando: `curl http://localhost:3001/health`
2. Verifique token: `WEBHOOK_SECRET` em `.env`
3. Verifique logs em Supabase: Tabela `webhook_logs`

### Dashboard não atualiza em tempo real?

1. Abra DevTools → Console
2. Verifique se há erros de conexão
3. Verifique RLS policies no Supabase

### Não consigo fazer login?

1. Verifique se Supabase está configurado
2. Tente criar uma conta nova
3. Verifique em Supabase Auth → Users

## 📝 Estrutura de Pastas

```
lovable-ops-dashboard/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Componentes do dashboard
│   │   └── ui/                 # Componentes shadcn
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilitários
│   ├── pages/                  # Páginas (Login, Dashboard, Admin)
│   └── App.tsx                 # App principal
├── webhook-server.ts           # Backend de webhooks
├── test-webhooks.ts            # Testes de integração
├── SUPABASE_SCHEMA.sql         # Schema do banco
├── IMPLEMENTATION_GUIDE.md     # Guia de implementação
└── package.json
```

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas!

## 📄 Licença

MIT

## 🎯 Roadmap

- [ ] Gráficos avançados com Recharts
- [ ] Exportar relatórios em PDF
- [ ] Integração com Slack/Discord
- [ ] App mobile (React Native)
- [ ] Dashboard customizável
- [ ] Sistema de comissões
- [ ] Análise preditiva

## 💬 Suporte

Alguma dúvida? Abra uma issue no repositório!

---

**Desenvolvido com ❤️ para times comerciais**

**Stack**: React 18 + TypeScript + Tailwind + Supabase + Vite
