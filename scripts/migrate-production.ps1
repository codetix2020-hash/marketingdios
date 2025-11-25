# Script de migraciones para Windows PowerShell

Write-Host "🔄 Ejecutando migraciones en Supabase..." -ForegroundColor Cyan

# Verificar que DATABASE_URL existe
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL no está configurada" -ForegroundColor Red
    Write-Host "Por favor, configura la variable de entorno:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL = "tu_connection_string_de_supabase"' -ForegroundColor Yellow
    exit 1
}

# Ir a packages/database
Set-Location packages\database

# Ejecutar migraciones
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
pnpm install

Write-Host "🗄️ Ejecutando migraciones..." -ForegroundColor Cyan
pnpm migrate

Write-Host "⚡ Generando Prisma Client..." -ForegroundColor Cyan
pnpm generate

Write-Host "✅ Migraciones completadas" -ForegroundColor Green

