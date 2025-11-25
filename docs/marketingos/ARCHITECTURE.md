# MarketingOS - Modo Dios: Arquitectura

## Visión General

MarketingOS es un sistema completo de marketing automatizado con IA que integra generación de contenido, SEO, campañas de anuncios, publicación automática y análisis continuo.

## Arquitectura del Sistema

### Capas Principales

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js App Router)   │
│  apps/web/app/(dashboard)/marketing-os/ │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         API Layer (oRPC)                 │
│  packages/api/modules/marketing/         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│   AI     │ │  Social  │ │  Jobs    │
│  Engine  │ │ Publisher│ │(Trigger) │
└──────────┘ └──────────┘ └──────────┘
        │           │           │
        └───────────┼───────────┘
                    ▼
        ┌───────────────────┐
        │   Database        │
        │  (Prisma/Postgres) │
        └───────────────────┘
```

## Componentes Principales

### 1. Frontend (`apps/web/app/(dashboard)/marketing-os/`)

- **Dashboard Principal**: KPIs, logs, resumen general
- **Generación de Contenido**: UI para crear contenido con IA
- **SEO Analyzer**: Análisis y optimización SEO
- **ADS Creator**: Creación y gestión de campañas
- **CEO Cockpit**: Vista ejecutiva (solo Modo Dios)
- **Logs Avanzados**: Sistema de logs con resúmenes
- **Onboarding**: Wizard de configuración inicial

### 2. API Layer (`packages/api/`)

#### Módulos oRPC (`packages/api/modules/marketing/`)

- `generate-content.ts`: Genera contenido usando IA
- `list-content.ts`: Lista contenido generado
- `analyze-seo.ts`: Analiza SEO de URLs
- `create-ad-campaign.ts`: Crea campañas de anuncios
- `get-kpis.ts`: Obtiene KPIs del dashboard
- `list-logs.ts`: Lista logs del sistema

#### Lógica de IA (`packages/api/src/lib/ai/marketing/`)

- `content-generator.ts`: Motor de generación de contenido
- `seo-engine.ts`: Motor de análisis SEO
- `ads-engine.ts`: Motor de creación de campañas
- `agent.ts`: Agente de análisis y aprendizaje
- `ceo-cockpit.ts`: Generación de insights ejecutivos

#### Sistema Social (`packages/api/src/lib/social/`)

- `publisher.ts`: Publicación en redes sociales
- `scheduler.ts`: Programación de publicaciones
- `accounts.ts`: Gestión de cuentas OAuth

#### Sistema de Límites (`packages/api/src/lib/marketing/`)

- `limits.ts`: Verificación de límites por plan
- `logs-advanced.ts`: Sistema de logs avanzados

### 3. Jobs Automatizados (`packages/api/src/jobs/marketing/`)

- `autopublish.ts`: Auto-publicación cada 6h/12h/30m
- `daily-seo-report.ts`: Reporte SEO diario
- `weekly-exec-report.ts`: Reporte ejecutivo semanal/diario
- `learning-loop.ts`: Loop de aprendizaje continuo

### 4. Base de Datos (`packages/database/`)

#### Tablas Principales

- `MarketingContent`: Contenido generado
- `MarketingSeo`: Análisis SEO
- `MarketingAdCampaign`: Campañas de anuncios
- `MarketingAdPerformance`: Métricas de ads
- `MarketingPublication`: Publicaciones en redes
- `SocialMediaAccount`: Cuentas conectadas
- `MarketingKpi`: KPIs del dashboard
- `MarketingLog`: Logs del sistema
- `MarketingLearning`: Datos de aprendizaje
- `MarketingConfig`: Configuración por organización
- `MarketingUsage`: Tracking de uso mensual
- `MarketingOnboarding`: Estado del onboarding

## Flujos Principales

### Generación de Contenido

1. Usuario completa formulario en frontend
2. Frontend llama a `marketing.content.generate`
3. API verifica límites del plan
4. Se llama a `generateMarketingContent()` con IA
5. Contenido se guarda en `MarketingContent`
6. Se incrementa contador de uso
7. Se crea log del evento
8. Frontend muestra resultado

### Auto-publicación

1. Job `autopublish` se ejecuta (Trigger.dev)
2. Verifica si AutoPilot está activo
3. Genera contenido según preferencias
4. Publica en redes sociales conectadas
5. Actualiza `MarketingPublication`
6. Crea logs de éxito/error

### Análisis SEO

1. Usuario ingresa URL en frontend
2. Frontend llama a `marketing.seo.analyze`
3. API verifica límites
4. Se llama a `analyzeSeo()` con IA
5. Resultados se guardan en `MarketingSeo`
6. Se incrementa contador de uso
7. Frontend muestra análisis completo

## Planes y Límites

### GOD_MODE (Modo Dios Supremo)
- Sin límites
- IA avanzada (GPT-4o/Claude)
- Optimización cada 30 minutos
- Reporte diario
- Acceso a CEO Cockpit

### CLIENT_PREMIUM (199€/mes)
- 40 contenidos/mes
- 20 análisis SEO/mes
- 10 campañas ADS/mes
- Publicación cada 12h
- IA estándar (GPT-4o-mini)

### TRIAL
- 5 contenidos/mes
- 3 análisis SEO/mes
- 1 campaña ADS/mes
- Publicación cada 24h

## Seguridad y Permisos

- Verificación de membresía de organización en todos los endpoints
- Roles: `super-admin`, `admin`, `member`
- Modo Dios solo para organizaciones específicas
- Límites aplicados por organización

## Escalabilidad

- Jobs asíncronos con Trigger.dev
- Caché de resultados de IA cuando sea posible
- Índices en base de datos para consultas rápidas
- Paginación en listados grandes

