# MarketingOS - Modo Dios: Documentación de APIs

## Endpoints oRPC

Todos los endpoints están bajo el namespace `marketing.*` y requieren autenticación.

### Contenido

#### `marketing.content.generate`

Genera contenido de marketing usando IA.

**Input:**
```typescript
{
  organizationId: string;
  type: "EMAIL" | "POST" | "REEL" | "BLOG";
  topic: string;
  tone?: string;
  targetAudience?: string;
  length?: "short" | "medium" | "long";
  keywords?: string[];
}
```

**Output:**
```typescript
{
  content: {
    id: string;
    type: string;
    title: string;
    content: string;
    status: string;
    metadata: any;
  };
}
```

#### `marketing.content.list`

Lista contenido generado.

**Input:**
```typescript
{
  organizationId: string;
  userId?: string;
  type?: "EMAIL" | "POST" | "REEL" | "BLOG";
  status?: "DRAFT" | "GENERATED" | "OPTIMIZED" | "PUBLISHED" | "ARCHIVED";
  limit?: number;
  offset?: number;
}
```

### SEO

#### `marketing.seo.analyze`

Analiza SEO de una URL.

**Input:**
```typescript
{
  organizationId: string;
  url: string;
  content?: string;
  title?: string;
  metaDescription?: string;
  keywords?: string[];
}
```

**Output:**
```typescript
{
  seo: {
    id: string;
    url: string;
    score: number;
    status: string;
    analysis: any;
    recommendations: string[];
  };
  analysis: {
    title: {...};
    metaDescription: {...};
    keywords: {...};
    content: {...};
    technical: {...};
  };
}
```

### ADS

#### `marketing.ads.createCampaign`

Crea una campaña de anuncios.

**Input:**
```typescript
{
  organizationId: string;
  platform: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS" | "TWITTER_ADS";
  product?: string;
  service?: string;
  targetAudience?: string;
  goal: "AWARENESS" | "CONVERSIONS" | "LEADS" | "SALES" | "ENGAGEMENT";
  budget?: number;
  keywords?: string[];
  tone?: string;
}
```

**Output:**
```typescript
{
  campaign: {
    id: string;
    name: string;
    platform: string;
    adCopy: string;
    status: string;
  };
  recommendations: string[];
  estimatedPerformance: {
    ctr: number;
    cpc: number;
    conversions: number;
  };
}
```

### KPIs

#### `marketing.kpis.get`

Obtiene KPIs del dashboard.

**Input:**
```typescript
{
  organizationId: string;
  startDate?: string;
  endDate?: string;
}
```

### Logs

#### `marketing.logs.list`

Lista logs del sistema.

**Input:**
```typescript
{
  organizationId: string;
  level?: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  category?: string;
  limit?: number;
  offset?: number;
}
```

## Funciones Internas

### `generateMarketingContent(options)`

Genera contenido usando IA.

**Ubicación:** `packages/api/src/lib/ai/marketing/content-generator.ts`

### `analyzeSeo(options)`

Analiza SEO de una URL.

**Ubicación:** `packages/api/src/lib/ai/marketing/seo-engine.ts`

### `generateAdCampaign(options)`

Genera campaña de anuncios.

**Ubicación:** `packages/api/src/lib/ai/marketing/ads-engine.ts`

### `canUseFeature(organizationId, feature)`

Verifica si se puede usar una funcionalidad según límites.

**Ubicación:** `packages/api/src/lib/marketing/limits.ts`

### `incrementUsage(organizationId, feature)`

Incrementa contador de uso.

**Ubicación:** `packages/api/src/lib/marketing/limits.ts`

## Ejemplos de Uso

### Generar Contenido

```typescript
const result = await orpcClient.marketing.content.generate({
  organizationId: "org123",
  type: "POST",
  topic: "Marketing digital",
  tone: "professional",
  length: "medium"
});
```

### Analizar SEO

```typescript
const result = await orpcClient.marketing.seo.analyze({
  organizationId: "org123",
  url: "https://example.com",
  keywords: ["marketing", "digital"]
});
```

### Crear Campaña ADS

```typescript
const result = await orpcClient.marketing.ads.createCampaign({
  organizationId: "org123",
  platform: "FACEBOOK_ADS",
  goal: "CONVERSIONS",
  product: "Mi Producto",
  budget: 1000
});
```

