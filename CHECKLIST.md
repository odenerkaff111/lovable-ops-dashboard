# ✅ Checklist de Implementação - Dashboard Comercial

Use este checklist para acompanhar o progresso da implementação.

## 📋 Fase 1: Preparação (Lê este arquivo)

- [ ] Ler `RESUMO_EXECUTIVO.md`
- [ ] Ler `IMPLEMENTATION_GUIDE.md`
- [ ] Verificar arquivo `.env.example`
- [ ] Verificar pasta de documentação

## 🗄️ Fase 2: Banco de Dados (15 min)

- [ ] Acessar Supabase (https://app.supabase.com)
- [ ] Ir para: SQL Editor → New Query
- [ ] Copiar todo o conteúdo de `SUPABASE_SCHEMA.sql`
- [ ] Colar no editor
- [ ] Clicar "Run"
- [ ] Verificar se 6 tabelas foram criadas:
  - [ ] profiles
  - [ ] task_types
  - [ ] daily_goals
  - [ ] activity_logs
  - [ ] appointments
  - [ ] webhook_logs
- [ ] Verificar se data foi inserida em task_types (3 tipos)
- [ ] Verificar índices criados em Table Editor

## 🔐 Fase 3: Configuração de Segurança (5 min)

- [ ] No Supabase, ativar "Email Confirmations" (opcional mas recomendado)
- [ ] Verificar RLS policies em cada tabela:
  - [ ] profiles (tem 4 policies)
  - [ ] activity_logs (tem 3 policies)
  - [ ] appointments (tem 4 policies)
- [ ] Gerar um token secreto para webhooks (use: openssl rand -hex 32)
- [ ] Adicionar em `.env`: `VITE_WEBHOOK_SECRET=seu_token_gerado`

## 💾 Fase 4: Preparação do Frontend (5 min)

- [ ] Verificar se `.env` existe e está preenchido:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_PROJECT_ID
  - [ ] VITE_SUPABASE_PUBLISHABLE_KEY
  - [ ] VITE_WEBHOOK_SECRET
- [ ] Instalar dependências: `npm install`
- [ ] Verificar se não há erro de instalação

## 🚀 Fase 5: Testar Frontend (10 min)

- [ ] Executar: `npm run dev`
- [ ] Abrir navegador: http://localhost:5173
- [ ] Página de login aparece
- [ ] Criar primeira conta (faça com seu email)
- [ ] Fazer login com sucesso
- [ ] Dashboard carrega (vai estar vazio)

## 👥 Fase 6: Configurar Usuários e Metas (10 min)

- [ ] No Dashboard, procurar link ou botão "Admin" ou Settings
- [ ] Vai para: `/admin`
- [ ] Você já é admin (primeira conta criada)
- [ ] Criar novo usuário:
  - [ ] Email: exemplo@email.com
  - [ ] Nome: Seu Nome
  - [ ] Função: SDR (ou Closer, Social Seller, etc)
  - [ ] Clicar "Criar"
- [ ] Criar meta para este usuário:
  - [ ] Selecionar usuário
  - [ ] Selecionar tipo: "lead_criado"
  - [ ] Valor: 50
  - [ ] Clicar "Definir Meta"
- [ ] Criar mais uma meta: "lead_engajado" → 50
- [ ] Criar mais uma meta: "follow_up" → 50
- [ ] Verificar se aparecem no painel

## 🔌 Fase 7: Testar Webhooks Localmente (10 min - Opcional)

Se quiser testar sem precisar do n8n ainda:

- [ ] Instalar dependências extras: `npm install express cors dotenv @supabase/supabase-js`
- [ ] Em outro terminal: `npx ts-node webhook-server.ts`
- [ ] Deve exibir: "🚀 Servidor de webhooks rodando na porta 3001"
- [ ] Em terceiro terminal: `npx ts-node test-webhooks.ts`
- [ ] Todos os testes devem passar (✅ 4/4)
- [ ] Voltar ao Dashboard e atualizar a página
- [ ] Deve aparecer: "1/50 leads criados" para o usuário

## 🔗 Fase 8: Integração com n8n (20 min)

### 8.1 Configurar n8n para enviar dados

**Workflow 1: Quando novo lead é criado no CRM**

- [ ] Abrir n8n
- [ ] Criar novo workflow
- [ ] Adicionar nó: "CRM" (seu trigger de novo lead)
- [ ] Adicionar nó: "HTTP Request"
  - [ ] Method: POST
  - [ ] URL: `http://seu-servidor:3001/api/activity` (ou sua URL em produção)
  - [ ] Headers:
    - [ ] Authorization: `Bearer seu_token_secreto`
    - [ ] Content-Type: `application/json`
  - [ ] Body:
    ```json
    {
      "user_id": "{{ seu_user_id }}",
      "tipo_acao": "lead_criado",
      "lead_id": "{{ $node['CRM'].json.id }}",
      "timestamp": "{{ now().toISOString() }}"
    }
    ```
- [ ] Testar workflow
- [ ] Ver webhook sendo registrado no Dashboard

**Workflow 2: Quando lead vai para agendamento**

- [ ] Criar novo workflow
- [ ] Trigger: Lead entra em coluna "Agendamento"
- [ ] HTTP Request:
  - [ ] URL: `http://seu-servidor:3001/api/agendamento`
  - [ ] Body:
    ```json
    {
      "lead_id": "{{ $node['CRM'].json.id }}",
      "nome": "{{ $node['CRM'].json.name }}",
      "data_agendada": "{{ $node['CRM'].json.scheduled_date }}",
      "user_responsavel": "{{ seu_user_id }}"
    }
    ```

**Workflow 3: Após chamada de vendas**

- [ ] Criar novo workflow
- [ ] Trigger: Call finalizado
- [ ] HTTP Request:
  - [ ] URL: `http://seu-servidor:3001/api/call-status`
  - [ ] Body:
    ```json
    {
      "lead_id": "{{ $node['Call'].json.lead_id }}",
      "status": "{{ $node['Call'].json.result }}"
    }
    ```

## 📊 Fase 9: Verificação de Dados em Tempo Real (10 min)

- [ ] Dashboard deve atualizar automaticamente quando webhook é chamado
- [ ] Verificar:
  - [ ] "1/50 leads criados" aumenta
  - [ ] Barra de progresso avança
  - [ ] Mensagem gamificada aparece
- [ ] Clicar em agendamentos
  - [ ] Ver novo agendamento listado
  - [ ] Clicar em "Venda" e status muda
- [ ] Filtro de período funciona (Hoje, Semana, Mês)
- [ ] Métricas gerais (geral) atualizam corretamente

## 🌐 Fase 10: Deploy em Produção (30 min)

Escolha uma opção:

### Opção A: Vercel (Recomendado para Frontend)

- [ ] Conectar repositório ao GitHub
- [ ] Ir para: https://vercel.com
- [ ] Clicar "New Project"
- [ ] Selecionar repositório "lovable-ops-dashboard"
- [ ] Vercel auto-detecta como Vite/React
- [ ] Adicionar variáveis de ambiente (Settings → Environment Variables):
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_PROJECT_ID
  - [ ] VITE_SUPABASE_PUBLISHABLE_KEY
  - [ ] VITE_WEBHOOK_SECRET
  - [ ] VITE_API_BASE_URL (sua URL de produção)
- [ ] Clicar "Deploy"
- [ ] Verificar se build foi bem-sucedido
- [ ] Acessar URL fornecida: https://seu-projeto.vercel.app

### Opção B: Railway.app (Para Backend + Frontend)

- [ ] Ir para: https://railway.app
- [ ] Fazer login com GitHub
- [ ] Clicar "New Project"
- [ ] Selecionar "Deploy from GitHub repo"
- [ ] Conectar repositório
- [ ] Railway auto-detecta Node.js
- [ ] Adicionar variáveis de ambiente (Environment):
  - [ ] (mesmas da Opção A)
  - [ ] PORT (deixar vazio ou 3001)
- [ ] Clicar "Deploy"
- [ ] Aguardar deploy (2-5 min)
- [ ] Copiar URL fornecida

### Opção C: Render.com

- [ ] Ir para: https://render.com
- [ ] (Similar ao Railway)

## 📱 Fase 11: Teste Final em Produção (10 min)

Depois de fazer deploy:

- [ ] Acessar URL em produção
- [ ] Fazer login com sua conta
- [ ] Verificar dashboard
- [ ] Atualizar `.VITE_API_BASE_URL` para sua URL em produção
- [ ] Testar webhook de produção:
  ```bash
  curl -X POST https://sua-url-produção/api/activity \
    -H "Authorization: Bearer seu_token" \
    -H "Content-Type: application/json" \
    -d '{"user_id":"...","tipo_acao":"lead_criado","lead_id":"TEST_PROD"}'
  ```
- [ ] Verificar se dados aparecem no dashboard

## 🎉 Fase 12: Tudo Pronto!

- [ ] Dashboard funcionando localmente ✓
- [ ] Dashboard em produção ✓
- [ ] Webhooks testados ✓
- [ ] Integração com n8n feita ✓
- [ ] Dados fluindo em tempo real ✓

## 📈 Métricas para Validar

Quando tudo está funcionando corretamente, você deve ver:

**No Dashboard:**
- [ ] Leads criados (aumenta quando webhook é enviado)
- [ ] Leads engajados (aumenta quando webhook é enviado)
- [ ] Follow ups (aumenta quando webhook é enviado)
- [ ] Barra de progresso gamificada
- [ ] Mensagens motivacionais

**Em Agendamentos:**
- [ ] Lista de agendamentos pendentes
- [ ] Botões para marcar status
- [ ] Taxa de conversão atualiza automaticamente

**No Admin:**
- [ ] Usuários listados
- [ ] Metas exibidas corretamente
- [ ] Log de webhooks visível

## 🐛 Troubleshooting Rápido

Se algo não funciona:

| Problema | Solução |
|----------|---------|
| Não consigo fazer login | Verifique Supabase auth em https://app.supabase.com |
| Dashboard vazio | Crie usuários em `/admin` |
| Webhook não funciona | Verifique token em `.env` com `curl http://localhost:3001/health` |
| Não recebo dados | Verifique n8n workflow está enviando POST correto |
| Deploy não funciona | Verifique variáveis de ambiente em produção |

## 📞 Próximas Ações

1. ✅ **Comece pela Fase 2** (Banco de Dados)
2. 🔄 **Siga sequencialmente** cada fase
3. 📝 **Marque cada ✅** conforme completa
4. 🎯 **Ao final, todo workflow deve estar automático**

---

**Tempo total estimado**: 2-3 horas da primeira vez  
**Após setup**: Sistema roda 100% automático

**Dúvidas?** Abra uma issue no GitHub ou consulte `IMPLEMENTATION_GUIDE.md`
