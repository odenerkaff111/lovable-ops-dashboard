/**
 * Servidor Backend para receber Webhooks
 * Instale: npm install express cors dotenv @supabase/supabase-js
 * 
 * Para usar em produção com o Lovable:
 * - Configure como uma URL externa (pode usar Render.com, Vercel, Railway, etc)
 * - Configure variáveis de ambiente
 */

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Middleware de autenticação
const validateWebhook = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const expectedToken = process.env.WEBHOOK_SECRET;

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

/**
 * POST /api/activity
 * Registra uma atividade do usuário
 */
app.post("/api/activity", validateWebhook, async (req: Request, res: Response) => {
  try {
    const { user_id, tipo_acao, lead_id, timestamp, metadata } = req.body;

    // Validação básica
    if (!user_id || !tipo_acao || !lead_id) {
      return res.status(400).json({
        error: "Missing required fields: user_id, tipo_acao, lead_id",
      });
    }

    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/activity",
      payload: req.body,
      status_code: 200,
      created_at: new Date().toISOString(),
    });

    // Registrar atividade
    const { error } = await supabase.from("activity_logs").insert({
      user_id,
      action_type: tipo_acao,
      lead_id,
      metadata: metadata || {},
      timestamp: timestamp || new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    res.json({ success: true, message: "Atividade registrada com sucesso" });
  } catch (error) {
    console.error("Erro em /api/activity:", error);
    res.status(500).json({
      error: "Erro ao registrar atividade",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/agendamento
 * Registra um novo agendamento
 */
app.post("/api/agendamento", validateWebhook, async (req: Request, res: Response) => {
  try {
    const { lead_id, nome, data_agendada, user_responsavel, metadata } = req.body;

    // Validação básica
    if (!lead_id || !nome || !data_agendada || !user_responsavel) {
      return res.status(400).json({
        error: "Missing required fields: lead_id, nome, data_agendada, user_responsavel",
      });
    }

    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/agendamento",
      payload: req.body,
      status_code: 200,
      created_at: new Date().toISOString(),
    });

    // Verificar se já existe agendamento para este lead
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("lead_id", lead_id)
      .single();

    if (existing) {
      // Atualizar agendamento existente
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
      return res.json({ success: true, message: "Agendamento atualizado com sucesso" });
    }

    // Criar novo agendamento
    const { error } = await supabase.from("appointments").insert({
      lead_id,
      lead_name: nome,
      scheduled_date: data_agendada,
      assigned_user_id: user_responsavel,
    });

    if (error) throw error;

    res.json({ success: true, message: "Agendamento criado com sucesso" });
  } catch (error) {
    console.error("Erro em /api/agendamento:", error);
    res.status(500).json({
      error: "Erro ao registrar agendamento",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/call-status
 * Atualiza status de uma chamada
 */
app.post("/api/call-status", validateWebhook, async (req: Request, res: Response) => {
  try {
    const { lead_id, status, metadata } = req.body;

    // Validação básica
    if (!lead_id || !status) {
      return res.status(400).json({
        error: "Missing required fields: lead_id, status",
      });
    }

    // Validar status
    const validStatuses = ["pendente", "no_show", "venda_realizada", "venda_nao_realizada"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Log da chamada webhook
    await supabase.from("webhook_logs").insert({
      endpoint: "/api/call-status",
      payload: req.body,
      status_code: 200,
      created_at: new Date().toISOString(),
    });

    // Atualizar status do agendamento
    const { error } = await supabase
      .from("appointments")
      .update({
        status,
        call_status_metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", lead_id);

    if (error) throw error;

    res.json({ success: true, message: "Status da chamada atualizado com sucesso" });
  } catch (error) {
    console.error("Erro em /api/call-status:", error);
    res.status(500).json({
      error: "Erro ao atualizar status da chamada",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Error handling
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de webhooks rodando na porta ${PORT}`);
  console.log(`📍 Saúde: http://localhost:${PORT}/health`);
});

export default app;
