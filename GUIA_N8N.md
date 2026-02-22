# 🔗 Guia Prático: Integração n8n com Dashboard

Este guia mostra como configurar seus workflows no n8n para enviar dados automaticamente.

## 📋 Resumo Rápido

| Ação | Endpoint | Quando Usar |
|------|----------|-------------|
| Novo Lead | `POST /api/activity` | Lead criado no CRM |
| Engajamento | `POST /api/activity` | Lead saiu coluna de engajamento |
| Follow Up | `POST /api/activity` | Lead foi atualizado em follow up |
| Agendamento | `POST /api/agendamento` | Lead entrou em coluna agendamento |
| Resultado Call | `POST /api/call-status` | Call realizada |

---

## 🎯 Cenário 1: Registrar Novo Lead

**Quando:** Novo lead é criado no seu CRM

**No n8n:**

1. **Trigger**: CRM node ou webhook do seu CRM
2. **HTTP Request node**:

```
Method: POST
URL: http://seu-servidor:3001/api/activity (ou https://... em produção)

Headers:
Authorization: Bearer seu_token_secreto
Content-Type: application/json

Body:
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_acao": "lead_criado",
  "lead_id": "{{ $node['CRM'].json.id }}",
  "timestamp": "{{ now().toISOString() }}",
  "metadata": {
    "source": "instagram",
    "campaign": "prospecção"
  }
}
```

**Resultado no Dashboard:**
- ✅ Contador "Leads Criados" aumenta em 1
- ✅ Barra de progresso avança
- ✅ Mensagem gamificada aparece

---

## 🎯 Cenário 2: Registrar Lead Engajado

**Quando:** Lead sai da coluna de engajamento (ou é marcado como engajado)

**No n8n:**

```
Method: POST
URL: http://seu-servidor:3001/api/activity

Body:
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_acao": "lead_engajado",
  "lead_id": "{{ $node['CRM'].json.id }}",
  "timestamp": "{{ now().toISOString() }}"
}
```

**Obs:** O `user_id` deve ser o UUID do usuário que realizou a ação (você ou sua esposa)

---

## 🎯 Cenário 3: Registrar Follow Up

**Quando:** Lead é atualizado em coluna de follow up

**No n8n:**

```
Method: POST
URL: http://seu-servidor:3001/api/activity

Body:
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_acao": "follow_up",
  "lead_id": "{{ $node['CRM'].json.id }}",
  "timestamp": "{{ now().toISOString() }}"
}
```

---

## 🎯 Cenário 4: Registrar Agendamento

**Quando:** Lead entra em coluna de agendamento

**No n8n:**

```
Method: POST
URL: http://seu-servidor:3001/api/agendamento

Body:
{
  "lead_id": "{{ $node['CRM'].json.id }}",
  "nome": "{{ $node['CRM'].json.name }}",
  "data_agendada": "{{ $node['CRM'].json.scheduled_date }}",
  "user_responsavel": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "descricao": "{{ $node['CRM'].json.description }}"
  }
}
```

**Resultado no Dashboard:**
- ✅ Card de agendamento aparece na seção "Agendamentos"
- ✅ Contador "Leads em Agendamento" aumenta
- ✅ Você vê botões: "Venda", "No Show", "Não Realizada"

---

## 🎯 Cenário 5: Atualizar Status de Call

**Quando:** Você realiza uma call e marca o resultado

**No n8n:**

```
Method: POST
URL: http://seu-servidor:3001/api/call-status

Body:
{
  "lead_id": "{{ $node['CRM'].json.id }}",
  "status": "{{ $node['Call'].json.result }}",
  "metadata": {
    "duracao": "{{ $node['Call'].json.duration }}",
    "valor_venda": "{{ $node['Deal'].json.value }}",
    "observacoes": "{{ $node['Call'].json.notes }}"
  }
}
```

**Status válidos:**
- `pendente` - Ainda não foi realizado (padrão)
- `venda_realizada` - Cliente comprou ✅
- `no_show` - Cliente não apareceu ❌
- `venda_nao_realizada` - Chamou mas não vendeu

**Resultado no Dashboard:**
- ✅ Card de agendamento desaparece da lista
- ✅ Taxa de conversão atualiza automaticamente
- ✅ Taxa de no-show recalcula

---

## 🔐 Como Obter o `user_id` Correto

Você precisa do UUID de cada usuário.

**Opção 1: Via Dashboard Admin**
- Vá para `/admin`
- Você vê os UUIDs listados próximo aos nomes dos usuários

**Opção 2: Via Supabase**
- Supabase → Table Editor → profiles
- Copie o UUID da coluna `id`

**Seu user_id provavelmente é**:
- Você criou a primeira conta, então é admin
- Copie de `VITE_SUPABASE_PROJECT_ID` (nope, é diferente)
- Vá ao Supabase Table Editor → profiles → copie seu `id`

---

## ✅ Testando Seu Workflow no n8n

1. **Antes de publicar:**
   - Clique em "Test" (ou "Execute")
   - Se tiver botão "Execute node", teste aquele nó HTTP Request
   - Deve retornar:
   ```json
   {
     "success": true,
     "message": "Atividade registrada com sucesso"
   }
   ```

2. **Validar no Dashboard:**
   - Volte ao Dashboard
   - Atualizar página (F5)
   - Verificar se contador aumentou

3. **Verificar Log em Supabase:**
   - Supabase → Table Editor → webhook_logs
   - Procure pelo timestamp recente
   - Deve ter seu payload registrado

---

## 🛠️ Exemplo Completo: Workflow Full

Workflow que automatiza TUDO:

```
┌─────────────────────────────────────────┐
│  CRM Trigger (novo lead)                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  HTTP Request: POST /api/activity       │
│  (registra lead_criado)                 │
└────────────┬────────────────────────────┘
             │
             ▼ (espera 24h)
             
┌─────────────────────────────────────────┐
│  Conditional: Se lead foi engajado?     │
└─────────┬──────────────────────────────┘
          │
          ├─ SIM ─────────────────────────────┐
          │                                   │
          ▼                                   │
    ┌──────────────────────────────────┐    │
    │ HTTP Request: /api/activity      │    │
    │ (tipo: lead_engajado)            │    │
    └──────────────────────────────────┘    │
          │                                   │
          ├─ Espera 3 dias ──────────────────┘
          │
          ├─ Agendado? ───────────────────────┐
          │   SIM ▼                           │ NÃO
    ┌──────────────────────────────────┐     │
    │ HTTP Request: /api/agendamento   │     │
    │ (registra agendamento)           │     │
    └──────────┬───────────────────────┘     │
               │                              │
               ├─ Call Realizada? ─────────┐ │
               │   SIM ▼                   │ │
    ┌──────────────────────────────────┐  │ │
    │ HTTP Request: /api/call-status   │  │ │
    │ (status: venda_realizada, etc)   │  │ │
    └──────────────────────────────────┘  │ │
                                          │ │
                                  (continua...)
```

---

## 🚨 Troubleshooting n8n

| Erro | Solução |
|------|---------|
| `401 Unauthorized` | Token de webhook está errado. Verifique `VITE_WEBHOOK_SECRET` |
| `404 Not found` | URL está errada. Verifique endpoint (`/api/activity`, etc) |
| `500 Internal Server` | Supabase fora ou Schema não criado. Verifique SQL |
| `Missing required fields` | Faltou `user_id`, `tipo_acao` ou `lead_id`. Verifique JSON |
| `Invalid status` | Status de call inválido. Use: pendente, no_show, venda_realizada, venda_nao_realizada |

---

## 💡 Dicas Importantes

1. **Sempre use Bearer token:**
   ```
   Authorization: Bearer seu_token_super_secreto
   ```

2. **Timestamps em ISO:**
   ```
   "{{ now().toISOString() }}"
   ```

3. **UUIDs corretos:**
   - Use UUID válido (36 caracteres com hífens)
   - `550e8400-e29b-41d4-a716-446655440000` ✅
   - `seu_user_id` ❌

4. **Teste antes de publicar:**
   - Execute workflow em teste
   - Verifique resposta no Dashboard
   - Só depois publica

5. **Monitore webhook_logs:**
   - Supabase → Table Editor → webhook_logs
   - Ver todas as chamadas que foram feitas
   - Debugging perfeito

---

## 📍 URLs em Diferentes Ambientes

**Local (desenvolvimento):**
```
http://localhost:3001/api/activity
http://localhost:3001/api/agendamento
http://localhost:3001/api/call-status
```

**Produção (Vercel/Railway):**
```
https://seu-projeto-vercel.com/api/activity
https://seu-projeto-railway.app/api/agendamento
https://seu-projeto-render.com/api/call-status
```

⚠️ **Não esqueça de atualizar URLs quando fizer deploy!**

---

## 🎯 Exemplo Real: Krayin CRM

Se você usa Krayin CRM:

1. **Webhook de novo lead:**
   - Settings → Webhooks
   - URL: `http://seu-servidor:3001/api/activity`
   - Evento: "Lead created"
   - Payload:
   ```json
   {
     "user_id": "seu-uuid",
     "tipo_acao": "lead_criado",
     "lead_id": "{{ lead.id }}",
     "timestamp": "{{ now }}"
   }
   ```

2. **Via n8n (mais fácil):**
   - Criar workflow com Krayin trigger
   - Adicionar HTTP Request node
   - Configurar conforme acima

---

## 📚 Referências

- [n8n Docs](https://docs.n8n.io)
- [n8n HTTP Request](https://docs.n8n.io/nodes/n8n-nodes-base.http/)
- [Krayin Webhooks](https://krayincrm.com/docs/webhooks/)

---

**Pronto!** Agora seu n8n está enviando dados automaticamente para o Dashboard 🎉
