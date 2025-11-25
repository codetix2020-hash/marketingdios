# ⚡ Quick Start - MarketingOS en Vercel

## Para el usuario (Emiliano):

### Paso 1: Configurar variables en Vercel

Lee: `VERCEL-SETUP.md` y agrega las 4 variables de entorno.

**Resumen rápido:**
1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Agrega:
   - `DATABASE_URL` (de Supabase)
   - `OPENAI_API_KEY` (de OpenAI)
   - `BETTER_AUTH_SECRET` (genera uno aleatorio)
   - `BETTER_AUTH_URL` (tu URL de Vercel)
3. Marca todas para Production, Preview y Development
4. Haz redeploy

### Paso 2: Ejecutar migraciones

**Linux/Mac:**
```bash
# En tu terminal, en la raíz del proyecto:
DATABASE_URL="tu_supabase_url" bash scripts/migrate-production.sh
```

**Windows PowerShell:**
```powershell
$env:DATABASE_URL = "tu_supabase_url"
.\scripts\migrate-production.ps1
```

**O manualmente:**
```bash
cd packages/database
pnpm migrate
pnpm generate
```

### Paso 3: Push a GitHub

```bash
git add .
git commit -m "🚀 Deploy MarketingOS"
git push
```

### Paso 4: Esperar deploy de Vercel

Ve a Vercel dashboard y espera el ✅ verde.

### Paso 5: Configurar GOD_MODE

1. Ve a: `https://tu-proyecto.vercel.app/api/admin/setup-god-mode`
2. Verás una lista de organizaciones con sus IDs
3. Copia tu `organizationId`
4. Ejecuta:

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/setup-god-mode \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "PEGA_TU_ID_AQUI"}'
```

**O desde PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://tu-proyecto.vercel.app/api/admin/setup-god-mode" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"organizationId": "PEGA_TU_ID_AQUI"}'
```

### Paso 6: ¡Listo!

Entra a: `https://tu-proyecto.vercel.app/marketing-os`

Deberías ver el dashboard de MarketingOS funcionando.

### Paso 7: Borrar endpoint temporal (IMPORTANTE)

Después de configurar GOD_MODE, borra este archivo por seguridad:

`apps/web/app/api/admin/setup-god-mode/route.ts`

Luego haz commit y push:

```bash
git add .
git commit -m "🔒 Removed temporary setup endpoint"
git push
```

## ¿Problemas?

### El servidor no arranca
- Revisa logs de Vercel
- Verifica que todas las variables estén configuradas
- Asegúrate de que las migraciones se ejecutaron

### Error "DATABASE_URL not set"
- Verifica que la variable esté en Vercel
- Asegúrate de hacer redeploy después de agregar variables

### Error "Organization not found"
- Verifica que la organización existe en Supabase
- Usa el endpoint GET para ver las organizaciones disponibles

### No puedo acceder a /marketing-os
- Verifica que estés autenticado
- Asegúrate de tener una organización activa
- Revisa los logs del navegador (F12)

## Comandos Útiles

### Ver organizaciones disponibles:
```bash
curl https://tu-proyecto.vercel.app/api/admin/setup-god-mode
```

### Verificar configuración GOD_MODE:
1. Ve a `/marketing-os/ceo-cockpit`
2. Si carga, GOD_MODE está activo
3. Si da error 403, verifica la configuración

## Soporte

Si tienes problemas:
1. Revisa los logs de Vercel
2. Revisa los logs de Supabase
3. Verifica que todas las variables estén correctas
4. Asegúrate de que las migraciones se ejecutaron

