# 🚀 Configuración de Variables de Entorno en Vercel

## Pasos para Configurar

1. Ve a: https://vercel.com/dashboard → Tu Proyecto → Settings → Environment Variables

2. Agrega estas variables (marca **Production**, **Preview** y **Development** para todas):

## Variables requeridas:

### DATABASE_URL

- Ve a Supabase → Settings → Database → Connection string (URI)
- Copia la URI completa que comienza con `postgresql://`
- Pégala en Vercel

**Ejemplo:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

### OPENAI_API_KEY

- Ve a: https://platform.openai.com/api-keys
- Crea una nueva API key
- Cópiala completa (comienza con `sk-`)
- Pégala en Vercel

**Ejemplo:**
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### BETTER_AUTH_SECRET

- Genera un string aleatorio de 32+ caracteres
- Ejemplo: `codetix-marketing-ultra-secret-2024-production`
- Pégalo en Vercel

**Puedes generar uno aquí:** https://generate-secret.vercel.app/32

### BETTER_AUTH_URL

- Usa tu URL de producción de Vercel
- Ejemplo: `https://tu-proyecto.vercel.app`
- O tu dominio personalizado si lo tienes

**Ejemplo:**
```
https://marketingos.vercel.app
```

## Después de agregar las variables:

1. Ve a **Deployments**
2. Click en el último deploy → **"Redeploy"**
3. Espera a que termine el deploy (verás ✅ verde)

## Verificación

Después del redeploy, verifica que las variables estén cargadas:

1. Ve a Settings → Environment Variables
2. Deberías ver las 4 variables listadas
3. Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**

## Notas Importantes

- ⚠️ **Nunca** compartas tus API keys públicamente
- ⚠️ Las variables se aplican en el próximo deploy
- ⚠️ Si cambias una variable, necesitas hacer redeploy

