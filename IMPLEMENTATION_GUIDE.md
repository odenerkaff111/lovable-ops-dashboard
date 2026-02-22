# Dashboard Comercial Gamificado - Guia de Implementação

## 📋 Checklist de Implementação

### ✅ 1. Configuração do Banco de Dados (Supabase)

**Arquivo**: `SUPABASE_SCHEMA.sql`

Execute no Supabase SQL Editor:
1. Vá para: https://app.supabase.com → Seu Projeto
2. Abra SQL Editor → New Query
3. Cole todo o conteúdo de `SUPABASE_SCHEMA.sql`
4. Clique em "Run"

**Tabelas criadas**:
- `profiles` - Perfis de usuários
- `task_types` - Tipos de tarefas (lead_criado, lead_engajado, follow_up)
- `daily_goals` - Metas diárias por usuário e tipo
- `activity_logs` - Log imutável de atividades
- `appointments` - Agendamentos com status
- `webhook_logs` - Auditoria de webhooks

### ✅ 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase (já existe no projeto)
VITE_SUPABASE_PROJECT_ID="aahzounzettyugovalio"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://aahzounzettyugovalio.supabase.co"

# Webhook Secret (para validar chamadas do n8n)
VITE_WEBHOOK_SECRET="seu_token_secreto_aqui"

# Backend Webhook Server (quando rodando localmente)
VITE_API_BASE_URL="http://localhost:3001"
```

### ✅ 3. Servidor de Webhooks

**Arquivo**: `webhook-server.ts`

#### Instalação:

```bash
# Na raiz do projeto
npm install express cors dotenv @supabase/supabase-js
npm install -D typescript @types/express @types/node
```

#### Executar localmente:

```bash
npx ts-node webhook-server.ts
```

Saída esperada:
```
🚀 Servidor de webhooks rodando na porta 3001
📍 Saúde: http://localhost:3001/health
```

#### Endpoints disponíveis:

**1. POST /api/activity**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_acao": "lead_criado",
  "lead_id": "LEAD_CRM_123",
  "timestamp": "2024-02-21T10:30:00Z",
  "metadata": {
    "source": "instagram",
    "campaign": "prospecção"
  }
}
```

**2. POST /api/agendamento**
```json
{
  "lead_id": "LEAD_CRM_123",
  "nome": "João Silva",
  "data_agendada": "2024-02-22T14:00:00Z",
  "user_responsavel": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {}
}
```

**3. POST /api/call-status**
```json
{
  "lead_id": "LEAD_CRM_123",
  "status": "venda_realizada",
  "metadata": {
    "valor_venda": 5000,
    "observacoes": "Cliente fechou contrato"
  }
}
```

### ✅ 4. Integração com n8n

#### Configurar webhook no n8n:

1. **Criar novo workflow no n8n**
2. **Adicionar nó HTTP Request**
3. **Configurar para cada ação**:

**Exemplo 1: Quando novo lead é criado no CRM**
```
POST: http://seu-servidor:3001/api/activity
Headers: Authorization: Bearer SEU_TOKEN_SECRETO
Body:
{
  "user_id": "{{workflow.variables.user_id}}",
  "tipo_acao": "lead_criado",
  "lead_id": "{{$node['CRM Trigger'].json.lead_id}}",
  "timestamp": "{{now().toISOString()}}",
  "metadata": {"source": "crm"}
}
```

**Exemplo 2: Quando lead passa para agendamento**
```
POST: http://seu-servidor:3001/api/agendamento
Headers: Authorization: Bearer SEU_TOKEN_SECRETO
Body:
{
  "lead_id": "{{$node['CRM'].json.lead_id}}",
  "nome": "{{$node['CRM'].json.lead_name}}",
  "data_agendada": "{{$node['CRM'].json.scheduled_date}}",
  "user_responsavel": "{{$node['Get User'].json.user_id}}"
}
```

**Exemplo 3: Após chamada de vendas**
```
POST: http://seu-servidor:3001/api/call-status
Headers: Authorization: Bearer SEU_TOKEN_SECRETO
Body:
{
  "lead_id": "{{$node['CRM'].json.lead_id}}",
  "status": "{{$node['Call Result'].json.status}}",
  "metadata": {
    "duracao_chamada": "{{$node['Call'].json.duration}}",
    "valor_venda": "{{$node['Deal'].json.value}}"
  }
}
```

### ✅ 5. Componentes Frontend Implementados

#### Existentes:
- ✅ `GamifiedProgressBar.tsx` - Barra com mensagens motivacionais
- ✅ `UserPerformanceCard.tsx` - Card de performance do usuário
- ✅ `AppointmentCard.tsx` - Card de agendamento (read-only)
- ✅ `PeriodFilter.tsx` - Filtro de período
- ✅ `StatCard.tsx` - Card de estatísticas

#### Novos:
- ✅ `AppointmentCardInteractive.tsx` - Card com botões de status

#### A Implementar:
- ⏳ Melhorar Dashboard com nova estrutura
- ⏳ Adicionar filtros avançados
- ⏳ Painel admin completo
- ⏳ Gráficos de análise
- ⏳ Notificações em tempo real

### ✅ 6. Fluxo de Dados Completo

```
n8n Webhook
    ↓
webhook-server.ts (Express)
    ↓
Supabase (activity_logs, appointments)
    ↓
Frontend (React + Realtime subscriptions)
    ↓
Dashboard atualizado
```

### ✅ 7. Deploy para Produção

#### Opção 1: Render.com (recomendado)

1. Fazer fork do repositório para seu GitHub
2. Ir para https://render.com
3. New → Web Service
4. Conectar seu repositório GitHub
5. Build command: `npm install && npm run build`
6. Start command: `npm run dev`
7. Adicionar variáveis de ambiente
8. Deploy

#### Opção 2: Vercel (Frontend + API)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Opção 3: Railway.app

Similar ao Render, muito fácil. Recomendado para começar.

### ✅ 8. Testando Localmente

```bash
# Terminal 1: Frontend
npm run dev
# Acesso em: http://localhost:5173

# Terminal 2: Backend de webhooks
npx ts-node webhook-server.ts
# Server em: http://localhost:3001

# Terminal 3: Testar webhook com curl
curl -X POST http://localhost:3001/api/activity \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo_acao": "lead_criado",
    "lead_id": "TEST_001"
  }'
```

### ✅ 9. Painel Admin

O painel admin (`/admin`) permite:
- ✅ Criar usuários (role: sdr, closer, social_seller, etc)
- ✅ Definir metas diárias por usuário
- ✅ Ativar/desativar usuários
- ✅ Ver log de webhooks

### ✅ 10. Monitoramento

**Métricas disponíveis no Dashboard**:

**Por Usuário (individual)**:
- Leads criados hoje
- Leads engajados hoje
- Follow ups realizados hoje
- Barra de progresso gamificada
- Percentual da meta

**Geral (todos usuários)**:
- Total de leads criados
- Total engajados
- Total follow ups
- Leads em agendamento
- Calls agendadas hoje
- Calls realizadas
- Taxa de no-show %
- Taxa de conversão %

## 🎯 Próximas Ações

1. **Executar SUPABASE_SCHEMA.sql** no Supabase
2. **Instalar dependências**: `npm install`
3. **Configurar webhook-server.ts** localmente
4. **Fazer teste com curl** nos endpoints
5. **Integrar com n8n** seus workflows
6. **Fazer login** no Dashboard
7. **Ir para /admin** e criar usuários com metas
8. **Enviar dados via webhook** e ver atualizar em tempo real

## ❓ Dúvidas?

- Documentação Supabase: https://supabase.com/docs
- Documentação n8n: https://docs.n8n.io
- Issues do GitHub: Criar uma issue descrevendo o problema
