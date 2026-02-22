@echo off
REM Script de inicialização rápida - Dashboard Comercial Gamificado
REM Execute: setup.bat

setlocal enabledelayedexpansion

echo.
echo ======================================
echo 🚀 Dashboard Comercial Gamificado
echo ======================================
echo.

REM Cores não funcionam bem em batch, então vamos usar símbolos

REM Check Node.js
echo 📋 Verificando Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js não encontrado! Instale em: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js: %NODE_VERSION%
echo ✅ npm: %NPM_VERSION%
echo.

REM Instalar dependências
echo 📦 Instalando dependências...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências instaladas
echo.

REM Verificar .env
echo 🔐 Verificando configurações...
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado
    echo Criando a partir de .env.example...
    copy .env.example .env
    echo ✅ Arquivo .env criado
    echo ⚠️  Lembre-se de adicionar seu WEBHOOK_SECRET!
) else (
    echo ✅ Arquivo .env encontrado
)
echo.

REM Verificar variáveis essenciais
echo 🔍 Verificando variáveis de ambiente...

findstr /L "VITE_SUPABASE_URL" .env >nul
if errorlevel 1 (
    echo ❌ VITE_SUPABASE_URL não encontrado
) else (
    echo ✅ VITE_SUPABASE_URL
)

findstr /L "VITE_SUPABASE_PROJECT_ID" .env >nul
if errorlevel 1 (
    echo ❌ VITE_SUPABASE_PROJECT_ID não encontrado
) else (
    echo ✅ VITE_SUPABASE_PROJECT_ID
)

findstr /L "VITE_SUPABASE_PUBLISHABLE_KEY" .env >nul
if errorlevel 1 (
    echo ❌ VITE_SUPABASE_PUBLISHABLE_KEY não encontrado
) else (
    echo ✅ VITE_SUPABASE_PUBLISHABLE_KEY
)

findstr /L "VITE_WEBHOOK_SECRET" .env >nul
if errorlevel 1 (
    echo ❌ VITE_WEBHOOK_SECRET não encontrado
    echo ⚠️  Configure em .env antes de usar webhooks
) else (
    echo ✅ VITE_WEBHOOK_SECRET
)
echo.

REM Verificar se schema foi criado
echo 🗄️  Verificando banco de dados...
echo ⚠️  Se é primeira vez, execute SUPABASE_SCHEMA.sql em Supabase
echo Instruções:
echo   1. Vá para: https://app.supabase.com
echo   2. Projeto → SQL Editor → New Query
echo   3. Cole conteúdo de: SUPABASE_SCHEMA.sql
echo   4. Clique 'Run'
echo.

REM Próximos passos
echo ═══════════════════════════════════════
echo 🎯 Próximos passos:
echo.
echo 1️⃣  Execute SUPABASE_SCHEMA.sql em Supabase
echo 2️⃣  Inicie o frontend:
echo    npm run dev
echo.
echo 3️⃣  Em outro terminal (para webhooks locais - opcional):
echo    npm install express cors dotenv @supabase/supabase-js
echo    npx ts-node webhook-server.ts
echo.
echo 4️⃣  Para testar webhooks:
echo    npx ts-node test-webhooks.ts
echo.
echo ═══════════════════════════════════════
echo.

setlocal enabledelayedexpansion
set /p response="Deseja iniciar o servidor de desenvolvimento agora? (s/n): "
if /i "!response!"=="s" (
    echo 🚀 Iniciando npm run dev...
    call npm run dev
) else (
    echo ⏸️  Setup concluído!
    echo Execute 'npm run dev' quando quiser iniciar
    pause
)

endlocal
