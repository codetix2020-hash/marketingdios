# 🧠 Script de Población de Memoria - CodeTix

Este script pobla la memoria inicial de MarketingOS con información sobre CodeTix.

## 📋 Pre-requisitos

1. **Variables de entorno necesarias:**
   - `DATABASE_URL`: Tu conexión a la base de datos (Neon/PostgreSQL)
   - `OPENAI_API_KEY`: Tu API key de OpenAI para generar embeddings

2. **Organización creada:** Necesitas tener al menos una organización en la base de datos.

## 🚀 Uso

### Opción 1: Buscar organización automáticamente

```bash
DATABASE_URL="postgresql://..." OPENAI_API_KEY="sk-..." npx tsx scripts/seed-memory.ts
```

El script buscará la organización más reciente en tu base de datos.

### Opción 2: Especificar organizationId

```bash
DATABASE_URL="postgresql://..." OPENAI_API_KEY="sk-..." npx tsx scripts/seed-memory.ts org_123abc
```

## 📦 Qué hace el script

Crea **5 memorias** con embeddings generados por OpenAI:

1. **ADN del Negocio** (importancia: 10/10)
   - Descripción de CodeTix
   - Servicios principales
   - Propuesta de valor
   - Target y tono de comunicación

2. **Productos** (importancia: 9/10)
   - Página Web Básica (€130)
   - Página Web Premium (€320)
   - Sistema de Reservas (€39/mes)
   - Chatbot WhatsApp (€50 + €20/mes)

3. **Caso de Éxito: 70/30 Restobar** (importancia: 8/10)
   - Aumento de reservas del 40%
   - Aprendizaje sobre CMS

4. **Caso de Éxito: La Quilmeña** (importancia: 8/10)
   - Reducción del 60% en llamadas
   - ROI inmediato de WhatsApp

5. **Estrategia de Contenido** (importancia: 9/10)
   - Pilares de contenido
   - Formatos que funcionan
   - Plataformas y frecuencia

6. **Posicionamiento** (importancia: 9/10)
   - Ventajas vs competencia
   - Diferenciadores clave

## ✅ Output esperado

```
🧠 Iniciando población de memoria de CodeTix...

🔍 No se proveyó organizationId, buscando en la base de datos...
✅ Organización encontrada: CodeTix (org_123abc)

📝 Guardando ADN del negocio...
  ✅ ADN del negocio guardado
📝 Guardando información de productos...
  ✅ Productos guardados
📝 Guardando casos de éxito...
  ✅ Caso de éxito: 70/30 Restobar
  ✅ Caso de éxito: Panadería La Quilmeña
📝 Guardando estrategia de contenido...
  ✅ Estrategia de contenido guardada
📝 Guardando posicionamiento vs competencia...
  ✅ Posicionamiento guardado

✅ ¡Memoria poblada exitosamente!

📊 Resumen:
   - 5 memorias guardadas
   - Organización: org_123abc
   - Tipos: business_dna (3), learning (2), prompt_template (1)
   - Embeddings generados con OpenAI
```

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY is not set"
Asegúrate de pasar la variable de entorno:
```bash
OPENAI_API_KEY="sk-..." npx tsx scripts/seed-memory.ts
```

### Error: "No se encontró ninguna organización"
Primero crea una organización en la aplicación o pasa el ID manualmente:
```bash
npx tsx scripts/seed-memory.ts org_tu_id_aqui
```

### Error: "DATABASE_URL is not set"
Pasa la URL de tu base de datos:
```bash
DATABASE_URL="postgresql://..." npx tsx scripts/seed-memory.ts
```

## 🎯 Próximos pasos

Después de poblar la memoria:

1. **Prueba la búsqueda semántica:**
   - Ve a MarketingOS → God Mode
   - Usa el orquestador para ver cómo usa la memoria

2. **Agrega más memorias:**
   - Casos de éxito adicionales
   - Aprendizajes de campañas
   - Templates de prompts específicos

3. **Verifica los embeddings:**
   - Los vectores se guardan en `MarketingMemory.embedding`
   - La similitud coseno se usa para búsqueda semántica

