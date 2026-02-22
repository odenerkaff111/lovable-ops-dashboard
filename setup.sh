#!/bin/bash
# Script de inicialização rápida - Dashboard Comercial Gamificado
# Execute: bash setup.sh

echo "======================================"
echo "🚀 Dashboard Comercial Gamificado"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo "${BLUE}📋 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js não encontrado! Instale em: https://nodejs.org${NC}"
    exit 1
fi
echo "${GREEN}✅ Node.js: $(node --version)${NC}"
echo "${GREEN}✅ npm: $(npm --version)${NC}"
echo ""

# Instalar dependências
echo "${BLUE}📦 Instalando dependências...${NC}"
npm install 2>&1 | grep -E "added|up to date|ERR"
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Dependências instaladas${NC}"
else
    echo "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi
echo ""

# Verificar .env
echo "${BLUE}🔐 Verificando configurações...${NC}"
if [ ! -f .env ]; then
    echo "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "Criando a partir de .env.example..."
    cp .env.example .env
    echo "${GREEN}✅ Arquivo .env criado${NC}"
    echo "${YELLOW}⚠️  Lembre-se de adicionar seu WEBHOOK_SECRET!${NC}"
else
    echo "${GREEN}✅ Arquivo .env encontrado${NC}"
fi
echo ""

# Verificar variáveis essenciais
echo "${BLUE}🔍 Verificando variáveis de ambiente...${NC}"

check_env() {
    if grep -q "^$1=" .env; then
        VALUE=$(grep "^$1=" .env | cut -d '=' -f 2)
        if [ -n "$VALUE" ] && [ "$VALUE" != "your_value_here" ]; then
            echo "${GREEN}✅ $1${NC}"
            return 0
        else
            echo "${RED}❌ $1 (vazio ou padrão)${NC}"
            return 1
        fi
    else
        echo "${RED}❌ $1 (não encontrado)${NC}"
        return 1
    fi
}

check_env "VITE_SUPABASE_URL"
check_env "VITE_SUPABASE_PROJECT_ID"
check_env "VITE_SUPABASE_PUBLISHABLE_KEY"
WEBHOOK_STATUS=$(check_env "VITE_WEBHOOK_SECRET")
echo ""

if [ $? -eq 1 ]; then
    echo "${YELLOW}⚠️  Algumas variáveis não estão configuradas${NC}"
    echo "${YELLOW}Configure em .env antes de iniciar${NC}"
else
    echo "${GREEN}✅ Todas as variáveis configuradas${NC}"
fi
echo ""

# Verificar se schema foi criado
echo "${BLUE}🗄️  Verificando banco de dados...${NC}"
echo "${YELLOW}⚠️  Se é primeira vez, execute SUPABASE_SCHEMA.sql em Supabase${NC}"
echo "Instruções:"
echo "  1. Vá para: https://app.supabase.com"
echo "  2. Projeto → SQL Editor → New Query"
echo "  3. Cole conteúdo de: SUPABASE_SCHEMA.sql"
echo "  4. Clique 'Run'"
echo ""

# Perguntar se quer iniciar
echo "${BLUE}═══════════════════════════════════════${NC}"
echo "${BLUE}🎯 Próximos passos:${NC}"
echo ""
echo "1️⃣  Execute SUPABASE_SCHEMA.sql em Supabase"
echo "2️⃣  Inicie o frontend:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3️⃣  Em outro terminal (para webhooks locais - opcional):"
echo "   ${YELLOW}npm install express cors dotenv @supabase/supabase-js${NC}"
echo "   ${YELLOW}npx ts-node webhook-server.ts${NC}"
echo ""
echo "4️⃣  Para testar webhooks:"
echo "   ${YELLOW}npx ts-node test-webhooks.ts${NC}"
echo ""
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""

read -p "Deseja iniciar o servidor de desenvolvimento agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "${BLUE}🚀 Iniciando npm run dev...${NC}"
    npm run dev
else
    echo "${YELLOW}⏸️  Setup concluído!${NC}"
    echo "Execute ${YELLOW}npm run dev${NC} quando quiser iniciar"
fi
