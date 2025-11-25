# MarketingOS - Modo Dios: Documentación Completa

## Bienvenido a MarketingOS

MarketingOS es un sistema completo de marketing automatizado con IA que integra:
- Generación de contenido (emails, posts, reels, blogs)
- Análisis y optimización SEO
- Creación y optimización de campañas de anuncios
- Publicación automática en redes sociales
- Análisis continuo y aprendizaje automático

## Documentación

- [Arquitectura](./ARCHITECTURE.md) - Estructura del sistema y componentes
- [APIs](./APIS.md) - Documentación de endpoints y funciones
- [Agente de Marketing](./AGENT.md) - Cómo funciona el agente de IA
- [Extensión del Sistema](./EXTENDING.md) - Cómo agregar nuevas funcionalidades

## Planes Disponibles

### Modo Dios Supremo (GOD_MODE)
- ✅ Sin límites de generación
- ✅ Sin límites de publicaciones
- ✅ Sin límites de análisis SEO
- ✅ Sin límites de campañas ADS
- ✅ IA avanzada (GPT-4o/Claude)
- ✅ Optimización continua cada 30 minutos
- ✅ Reporte ejecutivo diario
- ✅ Acceso a CEO Cockpit

### Cliente Premium (199€/mes)
- 📊 40 contenidos/mes
- 🔍 20 análisis SEO/mes
- 📢 10 campañas ADS/mes
- ⏰ Publicación automática cada 12h
- 🤖 IA estándar (GPT-4o-mini)

### Trial
- 📊 5 contenidos/mes
- 🔍 3 análisis SEO/mes
- 📢 1 campaña ADS/mes
- ⏰ Publicación automática cada 24h

## Inicio Rápido

1. **Ejecutar migraciones:**
   ```bash
   cd packages/database
   npx prisma migrate dev --name marketingos
   ```

2. **Configurar organización:**
   - Acceder a `/marketing-os/onboarding`
   - Completar los 5 pasos de configuración

3. **Usar el sistema:**
   - Generar contenido: `/marketing-os/content/generate`
   - Analizar SEO: `/marketing-os/seo/analyze`
   - Crear campañas: `/marketing-os/ads/create`
   - Ver dashboard: `/marketing-os`

## Características Principales

### Motor de Generación de Contenido
- Genera contenido profesional usando IA
- Soporta múltiples tipos: emails, posts, reels, blogs
- Personalizable por tono, audiencia, longitud
- Optimizado para SEO y engagement

### Motor SEO
- Análisis completo de URLs
- Score SEO 0-100
- Recomendaciones específicas
- Contenido optimizado generado automáticamente

### Motor ADS
- Crea campañas para múltiples plataformas
- Optimiza copy y targeting
- Estima performance
- Recomendaciones de optimización

### AutoPilot
- Genera y publica contenido automáticamente
- Configurable por frecuencia
- Aprende de preferencias del usuario
- Publica en múltiples redes simultáneamente

### Agente de Aprendizaje
- Analiza performance continuamente
- Detecta oportunidades y riesgos
- Genera recomendaciones accionables
- Se auto-optimiza

## Soporte

Para preguntas o problemas:
1. Revisar la documentación
2. Verificar logs en `/marketing-os/logs`
3. Consultar CEO Cockpit para insights

## Changelog

### Fase 3 - Modo Dios Supremo
- ✅ Sistema de límites y planes
- ✅ CEO Cockpit
- ✅ Onboarding ultra rápido
- ✅ Logs avanzados
- ✅ Navegación lateral
- ✅ Documentación completa

### Fase 2
- ✅ Automatizaciones Trigger.dev
- ✅ Sistema de publicación social
- ✅ Agente de aprendizaje
- ✅ UIs completas

### Fase 1
- ✅ Base de datos
- ✅ Motores de IA
- ✅ APIs oRPC
- ✅ Dashboard básico

