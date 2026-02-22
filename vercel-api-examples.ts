/**
 * API Webhook para Vercel Functions
 * Salve em: vercel/functions/api/activity.ts (e crie similar para outros endpoints)
 * 
 * Para usar com Vercel:
 * 1. Configure vercel.json na raiz do projeto
 * 2. Adicione variáveis de ambiente no Vercel dashboard
 * 3. Deploy com: vercel
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Middleware de validação
function validateToken(req: VercelRequest): boolean {
  const auth = req.headers.authorization;
  const token = auth?.replace("Bearer ", "");
  return token === process.env.WEBHOOK_SECRET;
}

// API: POST /api/activity
export async function activity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { user_id, tipo_acao, lead_id, timestamp, metadata } = req.body;

    if (!user_id || !tipo_acao || !lead_id) {
      return res.status(400).json({
        error: "Missing required fields: user_id, tipo_acao, lead_id",
      });
    }

    // Registrar atividade
    const { error } = await supabase.from("activity_logs").insert({
      user_id,
      action_type: tipo_acao,
      lead_id,
      metadata: metadata || {},
      timestamp: timestamp || new Date().toISOString(),
    });

    if (error) throw error;

    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/activity",
      payload: req.body,
      status_code: 200,
    });

    res.status(200).json({
      success: true,
      message: "Atividade registrada com sucesso",
    });
  } catch (error) {
    console.error("Erro em /api/activity:", error);
    res.status(500).json({
      error: "Erro ao registrar atividade",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// API: POST /api/agendamento
export async function agendamento(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { lead_id, nome, data_agendada, user_responsavel, metadata } =
      req.body;

    if (!lead_id || !nome || !data_agendada || !user_responsavel) {
      return res.status(400).json({
        error:
          "Missing required fields: lead_id, nome, data_agendada, user_responsavel",
      });
    }

    // Verificar se já existe
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("lead_id", lead_id)
      .single();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from("appointments")
        .update({
          lead_name: nome,
          scheduled_date: data_agendada,
          assigned_user_id: user_responsavel,
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", lead_id);

      if (error) throw error;
      return res.status(200).json({
        success: true,
        message: "Agendamento atualizado com sucesso",
      });
    }

    // Criar novo
    const { error } = await supabase.from("appointments").insert({
      lead_id,
      lead_name: nome,
      scheduled_date: data_agendada,
      assigned_user_id: user_responsavel,
    });

    if (error) throw error;

    // Log
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/agendamento",
      payload: req.body,
      status_code: 200,
    });

    res.status(200).json({
      success: true,
      message: "Agendamento criado com sucesso",
    });
  } catch (error) {
    console.error("Erro em /api/agendamento:", error);
    res.status(500).json({
      error: "Erro ao registrar agendamento",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// API: POST /api/call-status
export async function callStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { lead_id, status, metadata } = req.body;

    if (!lead_id || !status) {
      return res.status(400).json({
        error: "Missing required fields: lead_id, status",
      });
    }

    const validStatuses = [
      "pendente",
      "no_show",
      "venda_realizada",
      "venda_nao_realizada",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Atualizar status
    const { error } = await supabase
      .from("appointments")
      .update({
        status,
        call_status_metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", lead_id);

    if (error) throw error;

    // Log
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/call-status",
      payload: req.body,
      status_code: 200,
    });

    res.status(200).json({
      success: true,
      message: "Status da chamada atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro em /api/call-status:", error);
    res.status(500).json({
      error: "Erro ao atualizar status da chamada",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Health check
export async function health(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
}
