/**
 * Funções para integração via Webhooks
 * Essas funções seriam chamadas por um backend/servidor Node.js/Express
 * Você precisa criar um servidor separado para receber os webhooks do n8n
 */

import { supabase } from "./supabase";

// Tipos para os webhooks
export interface ActivityWebhookPayload {
  user_id: string;
  tipo_acao: "lead_criado" | "lead_engajado" | "follow_up";
  lead_id: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface AgendamentoWebhookPayload {
  lead_id: string;
  nome: string;
  data_agendada: string;
  user_responsavel: string;
  metadata?: Record<string, any>;
}

export interface CallStatusWebhookPayload {
  lead_id: string;
  status: "no_show" | "venda_realizada" | "venda_nao_realizada";
  metadata?: Record<string, any>;
}

/**
 * Registra uma atividade do usuário
 * POST /api/activity
 */
export async function registerActivity(payload: ActivityWebhookPayload) {
  try {
    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/activity",
      payload: payload,
      created_at: new Date().toISOString(),
    });

    // Registrar atividade no log
    const { error } = await supabase.from("activity_logs").insert({
      user_id: payload.user_id,
      action_type: payload.tipo_acao,
      lead_id: payload.lead_id,
      metadata: payload.metadata || {},
      timestamp: payload.timestamp || new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true, message: "Atividade registrada com sucesso" };
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
    throw error;
  }
}

/**
 * Registra um novo agendamento
 * POST /api/agendamento
 */
export async function registerAppointment(
  payload: AgendamentoWebhookPayload
) {
  try {
    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/agendamento",
      payload: payload,
      created_at: new Date().toISOString(),
    });

    // Verificar se já existe agendamento para este lead
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("lead_id", payload.lead_id)
      .single();

    if (existing) {
      // Atualizar agendamento existente
      const { error } = await supabase
        .from("appointments")
        .update({
          lead_name: payload.nome,
          scheduled_date: payload.data_agendada,
          assigned_user_id: payload.user_responsavel,
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", payload.lead_id);

      if (error) throw error;
      return { success: true, message: "Agendamento atualizado com sucesso" };
    }

    // Criar novo agendamento
    const { error } = await supabase.from("appointments").insert({
      lead_id: payload.lead_id,
      lead_name: payload.nome,
      scheduled_date: payload.data_agendada,
      assigned_user_id: payload.user_responsavel,
    });

    if (error) {
      throw error;
    }

    return { success: true, message: "Agendamento criado com sucesso" };
  } catch (error) {
    console.error("Erro ao registrar agendamento:", error);
    throw error;
  }
}

/**
 * Atualiza status de uma chamada/agendamento
 * POST /api/call-status
 */
export async function updateCallStatus(payload: CallStatusWebhookPayload) {
  try {
    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/call-status",
      payload: payload,
      created_at: new Date().toISOString(),
    });

    // Atualizar status do agendamento
    const { error } = await supabase
      .from("appointments")
      .update({
        status: payload.status,
        call_status_metadata: payload.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", payload.lead_id);

    if (error) {
      throw error;
    }

    return { success: true, message: "Status da chamada atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar status da chamada:", error);
    throw error;
  }
}

/**
 * Função helper para validar token de webhook (opcional)
 */
export function validateWebhookToken(token: string | null): boolean {
  const expectedToken = import.meta.env.VITE_WEBHOOK_SECRET;
  return token === expectedToken;
}

/**
 * Exemplo de como usar com n8n:
 *
 * 1. Criar workflow no n8n com HTTP Request node
 * 2. URL: https://seu-domain.com/api/activity (ou outro endpoint)
 * 3. Método: POST
 * 4. Headers:
 *    - Content-Type: application/json
 *    - Authorization: Bearer SEU_TOKEN_SECRETO
 *
 * 5. Body (exemplo para activity):
 * {
 *   "user_id": "uuid-do-usuario",
 *   "tipo_acao": "lead_criado",
 *   "lead_id": "id-do-lead-crm",
 *   "timestamp": "2024-02-21T10:30:00Z",
 *   "metadata": {
 *     "source": "instagram",
 *     "campaign": "nome-campanha"
 *   }
 * }
 */
