/**
 * Arquivo de teste para validar webhooks
 * Execute com: npx ts-node test-webhooks.ts
 */

import fetch from "node-fetch";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "seu_token_secreto_aqui";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${WEBHOOK_SECRET}`,
};

// UUID de exemplo para teste (você precisa de um user_id real do Supabase)
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

async function testActivityWebhook() {
  console.log("\n🧪 Testando POST /api/activity...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/activity`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        tipo_acao: "lead_criado",
        lead_id: `TEST_LEAD_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test",
          campaign: "teste_automático",
        },
      }),
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data);
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  }
}

async function testAppointmentWebhook() {
  console.log("\n🧪 Testando POST /api/agendamento...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/agendamento`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        lead_id: `TEST_LEAD_${Date.now()}`,
        nome: "João da Silva Teste",
        data_agendada: new Date(Date.now() + 86400000).toISOString(),
        user_responsavel: TEST_USER_ID,
        metadata: {
          source: "test",
        },
      }),
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data);
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  }
}

async function testCallStatusWebhook() {
  console.log("\n🧪 Testando POST /api/call-status...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/call-status`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        lead_id: `TEST_LEAD_${Date.now() - 1000}`,
        status: "venda_realizada",
        metadata: {
          duracao_chamada: 300,
          valor_venda: 5000,
        },
      }),
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data);
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  }
}

async function testHealthCheck() {
  console.log("\n🧪 Testando GET /health...");
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data);
    return response.ok;
  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  }
}

async function runAllTests() {
  console.log("🚀 Iniciando testes de webhooks...");
  console.log(`🔗 URL: ${API_BASE_URL}`);
  console.log(`🔐 Token: ${WEBHOOK_SECRET.substring(0, 10)}...`);

  const results = {
    health: await testHealthCheck(),
    activity: await testActivityWebhook(),
    appointment: await testAppointmentWebhook(),
    callStatus: await testCallStatusWebhook(),
  };

  console.log("\n📋 Resumo dos Testes:");
  console.log("====================");
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? "✅" : "❌"} ${test}`);
  });

  const passedCount = Object.values(results).filter((r) => r).length;
  console.log(
    `\n🎯 Resultado: ${passedCount}/${Object.keys(results).length} testes passaram`
  );

  process.exit(passedCount === Object.keys(results).length ? 0 : 1);
}

// Executar testes
runAllTests().catch((error) => {
  console.error("Erro ao executar testes:", error);
  process.exit(1);
});
