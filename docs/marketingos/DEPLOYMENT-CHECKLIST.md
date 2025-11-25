# ✅ Checklist de Despliegue - MarketingOS

## 🚀 Despliegue en Vercel - Pasos rápidos

### 1. Configurar Variables de Entorno

Ver instrucciones detalladas en: `VERCEL-SETUP.md`

### 2. Ejecutar Migraciones (desde tu máquina local)

```bash
# Crear archivo .env temporal en la raíz:
DATABASE_URL="tu_supabase_connection_string"

# Ejecutar script de migraciones:
bash scripts/migrate-production.sh

# O manualmente:
cd packages/database
pnpm migrate
pnpm generate
```

**Windows PowerShell:**
```powershell
$env:DATABASE_URL = "tu_supabase_connection_string"
.\scripts\migrate-production.ps1
```

### 3. Push a GitHub (para deploy automático)

```bash
git add .
git commit -m "✅ MarketingOS production ready"
git push origin main
```

### 4. Configurar GOD_MODE (después del deploy)

**Opción A - Via API:**

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/setup-god-mode \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "tu-org-id"}'
```

**Opción B - Visitar en navegador:**

1. Ve a: `https://tu-proyecto.vercel.app/api/admin/setup-god-mode`
2. Verás lista de organizaciones
3. Copia tu `organizationId`
4. Usa el comando curl de arriba con tu ID

### 5. Verificar que funciona

Ve a: `https://tu-proyecto.vercel.app/marketing-os`

### 6. IMPORTANTE: Borrar endpoint temporal

Después de configurar GOD_MODE, borra:

`apps/web/app/api/admin/setup-god-mode/route.ts`

---

## Pre-despliegue

- [ ] Migraciones ejecutadas sin errores
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Servidor arranca sin errores (`npm run dev`)
- [ ] Variables de entorno configuradas
- [ ] Seed ejecutado correctamente

## Verificación de Frontend

- [ ] `/marketing-os` carga correctamente
- [ ] `/marketing-os/content/generate` funciona
- [ ] `/marketing-os/seo/analyze` funciona
- [ ] `/marketing-os/ads/create` carga
- [ ] `/marketing-os/ceo-cockpit` carga
- [ ] `/marketing-os/logs` carga
- [ ] `/marketing-os/onboarding` funciona

## Verificación de Backend

- [ ] Generación de contenido con IA funciona
- [ ] Análisis SEO genera resultados
- [ ] Sistema de límites verifica correctamente
- [ ] Tracking de uso mensual funciona

## Trigger.dev (Opcional para más adelante)

- [ ] `@trigger.dev/sdk` instalado
- [ ] `TRIGGER_API_KEY` configurada
- [ ] Jobs registrados

## Producción

- [ ] Base de datos de producción configurada
- [ ] Variables de entorno de producción configuradas
- [ ] Deploy a Vercel/Railway completado

## Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# OpenAI (requerido para IA)
OPENAI_API_KEY="sk-..."

# Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Trigger.dev (opcional)
TRIGGER_SECRET_KEY="tr_dev_..."
```

## Comandos de Verificación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar Prisma Client
cd packages/database
pnpm generate

# 3. Ejecutar migraciones
pnpm migrate

# 4. Ejecutar seed (opcional)
npx prisma db seed

# 5. Iniciar servidor
cd ../..
npm run dev
```

## Notas

- El seed crea un workspace de prueba con GOD_MODE
- Las migraciones deben ejecutarse antes de iniciar el servidor
- Verificar que todas las variables de entorno estén configuradas

