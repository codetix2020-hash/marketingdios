#!/bin/bash

echo "🔄 Ejecutando migraciones en Supabase..."

# Verificar que DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL no está configurada"
  echo "Por favor, crea un archivo .env en la raíz con:"
  echo "DATABASE_URL=\"tu_connection_string_de_supabase\""
  exit 1
fi

# Ir a packages/database
cd packages/database

# Ejecutar migraciones
echo "📦 Instalando dependencias..."
pnpm install

echo "🗄️ Ejecutando migraciones..."
pnpm migrate

echo "⚡ Generando Prisma Client..."
pnpm generate

echo "✅ Migraciones completadas"

