# MarketingOS - Modo Dios: Agente de Marketing

## Visión General

El Agente de Marketing es el cerebro del sistema. Analiza datos, detecta patrones, genera insights y se auto-optimiza continuamente.

## Funcionalidades Principales

### 1. Análisis de Performance

`analyzePerformance(organizationId, periodDays)`

Analiza el performance general de marketing y genera:
- Score general (0-100)
- Fortalezas y debilidades
- Tendencias detectadas
- Recomendaciones priorizadas

**Ejemplo:**
```typescript
const analysis = await analyzePerformance("org123", 30);
console.log(analysis.overallScore); // 85
console.log(analysis.recommendations); // [...]
```

### 2. Detección de Gaps

`detectContentGaps(organizationId)`

Detecta gaps en el contenido:
- Tipos de contenido faltantes
- Contenido desactualizado
- Baja tasa de publicación
- Keywords faltantes

### 3. Actualización de Estrategias

`updateStrategies(organizationId)`

Actualiza estrategias basándose en análisis:
- Recomienda cambios en contenido
- Sugiere ajustes en SEO
- Optimiza timing de publicaciones
- Ajusta presupuestos de ads

### 4. Recomendaciones de Acciones

`recommendActions(organizationId)`

Genera acciones específicas priorizadas:
- Acciones de alta prioridad
- Impacto esperado
- Tiempo estimado de implementación

## Flujo de Aprendizaje

```
1. Recopilar datos (KPIs, contenido, campañas)
   ↓
2. Analizar patrones y tendencias
   ↓
3. Generar insights usando IA
   ↓
4. Guardar aprendizajes en MarketingLearning
   ↓
5. Aplicar ajustes automáticos (si son de bajo riesgo)
   ↓
6. Generar recomendaciones para el usuario
```

## Loop de Aprendizaje Continuo

El job `learning-loop` se ejecuta cada hora y:

1. Analiza KPIs recientes (últimas 24h)
2. Detecta patrones
3. Genera insights
4. Guarda en `MarketingLearning`
5. Aplica ajustes automáticos de bajo riesgo

## Integración con CEO Cockpit

El agente alimenta el CEO Cockpit con:
- Estado actual del negocio
- Oportunidades detectadas
- Riesgos identificados
- Recomendaciones accionables
- Próximos pasos automáticos

## Personalización por Plan

- **GOD_MODE**: Usa GPT-4o, análisis más profundo, más insights
- **CLIENT_PREMIUM**: Usa GPT-4o-mini, análisis estándar
- **TRIAL**: Análisis básico

## Extensión del Agente

Para agregar nuevas funcionalidades:

1. Crear función en `packages/api/src/lib/ai/marketing/agent.ts`
2. Integrar con el loop de aprendizaje si es necesario
3. Agregar endpoint oRPC si se necesita acceso desde frontend
4. Documentar en este archivo

**Ejemplo:**
```typescript
export async function detectTrends(organizationId: string) {
  // Tu lógica aquí
  return trends;
}
```

