# MarketingOS - Modo Dios: Cómo Extender el Sistema

## Agregar Nuevo Tipo de Contenido

1. Actualizar enum en `packages/database/prisma/schema.prisma`:
```prisma
enum MarketingContentType {
  EMAIL
  POST
  REEL
  BLOG
  NEW_TYPE  // Agregar aquí
}
```

2. Actualizar `content-generator.ts`:
```typescript
const typeInstructions = {
  // ... existentes
  NEW_TYPE: `Instrucciones para nuevo tipo...`,
};
```

3. Actualizar UI en `ContentGenerator.tsx`:
```tsx
<SelectItem value="NEW_TYPE">Nuevo Tipo</SelectItem>
```

## Agregar Nueva Plataforma Social

1. Actualizar enum en schema:
```prisma
enum SocialMediaPlatform {
  // ... existentes
  NEW_PLATFORM
}
```

2. Agregar función en `publisher.ts`:
```typescript
async function publishToNewPlatform(options: {...}): Promise<PublishResult> {
  // Implementar lógica
}
```

3. Agregar case en `publishToPlatform()`:
```typescript
case "NEW_PLATFORM":
  return await publishToNewPlatform({...});
```

## Agregar Nuevo Job Automatizado

1. Crear archivo en `packages/api/src/jobs/marketing/`:
```typescript
export const newJob = task({
  id: "marketing.new-job",
  run: async (payload, { ctx }) => {
    // Lógica del job
  },
});
```

2. Exportar en `index.ts`:
```typescript
export { newJob } from "./new-job";
```

3. Configurar en Trigger.dev (cron, frecuencia, etc.)

## Agregar Nueva Métrica KPI

1. Crear función para calcular métrica:
```typescript
export async function calculateNewMetric(organizationId: string) {
  // Calcular métrica
  return value;
}
```

2. Guardar en `MarketingKpi`:
```typescript
await createMarketingKpi({
  organizationId,
  date: new Date(),
  metric: "new_metric",
  value: calculatedValue,
});
```

3. Mostrar en dashboard UI

## Agregar Nuevo Endpoint oRPC

1. Crear procedimiento en `packages/api/modules/marketing/procedures/`:
```typescript
export const newProcedure = protectedProcedure
  .route({...})
  .input(z.object({...}))
  .handler(async ({ input, context }) => {
    // Lógica
  });
```

2. Agregar al router en `router.ts`:
```typescript
export const marketingRouter = {
  // ... existentes
  newFeature: {
    action: newProcedure,
  },
};
```

## Agregar Nueva Funcionalidad al Agente

1. Crear función en `agent.ts`:
```typescript
export async function newAgentFunction(organizationId: string) {
  // Lógica del agente
  return result;
}
```

2. Integrar con loop de aprendizaje si es necesario
3. Documentar en `AGENT.md`

## Mejores Prácticas

1. **Siempre verificar límites** antes de ejecutar acciones costosas
2. **Crear logs** para todas las operaciones importantes
3. **Manejar errores** gracefully con mensajes claros
4. **Documentar** nuevas funcionalidades
5. **Testear** con diferentes planes (GOD_MODE, CLIENT_PREMIUM, TRIAL)
6. **Usar IA apropiada** según el plan del usuario

## Estructura de Archivos

```
packages/api/
├── modules/marketing/
│   ├── procedures/        # Endpoints oRPC
│   └── router.ts          # Router principal
├── src/
│   ├── lib/
│   │   ├── ai/marketing/  # Lógica de IA
│   │   ├── social/        # Publicación social
│   │   └── marketing/     # Límites, logs, etc.
│   └── jobs/marketing/    # Jobs automatizados

apps/web/app/(dashboard)/marketing-os/
├── components/            # Componentes compartidos
├── content/              # UI de contenido
├── seo/                  # UI de SEO
├── ads/                  # UI de ADS
└── ...
```

## Testing

1. Probar con diferentes organizaciones (diferentes planes)
2. Verificar límites se aplican correctamente
3. Probar con datos reales y simulados
4. Verificar logs se crean correctamente
5. Probar jobs automatizados

## Deployment

1. Ejecutar migraciones de Prisma
2. Verificar variables de entorno
3. Configurar Trigger.dev (si aplica)
4. Verificar permisos de APIs externas
5. Monitorear logs después del deployment

