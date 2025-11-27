import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { searchMemory } from './embeddings'

let anthropicInstance: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicInstance
}

interface OrchestrationContext {
  organizationId: string
  recentMetrics?: any
  pendingTasks?: string[]
}

/**
 * Meta-Agente Orquestador - Toma decisiones estratégicas cada 6 horas
 */
export async function orchestrate(context: OrchestrationContext) {
  const { organizationId } = context

  // 1. Recuperar memoria relevante del negocio
  const businessDNA = await searchMemory(
    organizationId,
    'business identity products services value proposition target audience',
    'business_dna',
    3
  )
  
  // 2. Recuperar aprendizajes recientes
  const recentLearnings = await searchMemory(
    organizationId,
    'successful content high performing campaigns best practices',
    'learning',
    5
  )
  
  // 3. Obtener estructuras virales recientes
  const trendingStructures = await prisma.viralBlueprint.findMany({
    where: { organizationId },
    take: 10,
    orderBy: { extractedAt: 'desc' },
  })

  // 4. Obtener métricas recientes de contenido
  const recentContent = await prisma.marketingContent.findMany({
    where: { organizationId },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      title: true,
      type: true,
      status: true,
      metadata: true,
      createdAt: true,
    },
  })

  // 5. Construir prompt para el orquestador
  const orchestrationPrompt = `
Eres el Meta-Agente Orquestador de MarketingOS, un sistema de marketing autónomo 24/7.

## CONTEXTO DEL NEGOCIO:
${businessDNA.map(m => `[Importancia: ${m.importance}/10]\n${m.content}`).join('\n\n')}

## APRENDIZAJES RECIENTES:
${recentLearnings.map(m => m.content).join('\n\n')}

## ESTRUCTURAS VIRALES DETECTADAS:
${trendingStructures.map(t => 
  `${t.platform.toUpperCase()}: ${t.hook}\nEstructura: ${t.structure}\nCTA: ${t.cta}\nMétricas: ${JSON.stringify(t.metrics)}`
).join('\n\n')}

## PERFORMANCE DE CONTENIDO RECIENTE:
${recentContent.slice(0, 10).map(c => 
  `${c.type} - ${c.title}: ${c.status} | Metadata: ${JSON.stringify(c.metadata)}`
).join('\n')}

## TU MISIÓN:
Analiza toda esta información y decide la estrategia de contenido para las próximas 6 horas.

Responde SOLO con JSON válido (sin markdown):
{
  "contentPlan": [
    {
      "type": "post | ad | email | landing_page",
      "platform": "instagram | facebook | twitter | linkedin | tiktok",
      "topic": "tema específico basado en el negocio",
      "angle": "ángulo creativo único",
      "viralHook": "estructura viral a usar (si aplica)",
      "priority": 1-10,
      "reasoning": "por qué crear este contenido ahora"
    }
  ],
  "optimizations": [
    {
      "target": "qué optimizar (campaña, contenido, proceso)",
      "action": "qué hacer exactamente",
      "expectedImpact": "impacto esperado",
      "reasoning": "por qué es importante"
    }
  ],
  "learningsToApply": [
    "aprendizaje específico del histórico que aplicaremos"
  ],
  "newAutomations": [
    "nueva automatización que deberíamos crear (si detectas patrón repetitivo)"
  ]
}
`

  // 6. Llamar a Claude Opus para decisión estratégica
  const anthropic = getAnthropicClient()
  const decision = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: orchestrationPrompt,
      },
    ],
  })

  // 7. Parsear respuesta
  const responseText = decision.content[0].type === 'text' 
    ? decision.content[0].text 
    : ''
  
  // Limpiar markdown si existe
  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const decisionJSON = JSON.parse(cleanedResponse)

  // 8. Guardar decisión en base de datos
  await prisma.marketingDecision.create({
    data: {
      organizationId,
      agentType: 'orchestrator',
      decision: JSON.stringify(decisionJSON),
      reasoning: 'Orchestration cycle - Strategic planning',
      context: {
        businessDNACount: businessDNA.length,
        learningsCount: recentLearnings.length,
        viralBlueprintsCount: trendingStructures.length,
        recentContentCount: recentContent.length,
      },
      executedAt: new Date(),
    },
  })

  return decisionJSON
}

export async function getRecentMetrics(organizationId: string) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const kpis = await prisma.marketingKpi.findMany({
    where: {
      organizationId,
      date: { gte: last24h }
    },
    orderBy: { date: 'desc' }
  })
  
  const content = await prisma.marketingContent.count({
    where: {
      organizationId,
      createdAt: { gte: last24h }
    }
  })
  
  const publications = await prisma.marketingPublication.count({
    where: {
      organizationId,
      publishedAt: { gte: last24h }
    }
  })
  
  return {
    kpis,
    contentGenerated: content,
    publicationsCreated: publications
  }
}

export async function getPendingTasks(organizationId: string) {
  const tasks: string[] = []
  
  // Verificar contenido en draft
  const drafts = await prisma.marketingContent.count({
    where: { organizationId, status: 'DRAFT' }
  })
  if (drafts > 0) tasks.push(`${drafts} contenidos en borrador pendientes de optimizar`)
  
  // Verificar publicaciones programadas
  const scheduled = await prisma.marketingPublication.count({
    where: { organizationId, status: 'SCHEDULED' }
  })
  if (scheduled > 0) tasks.push(`${scheduled} publicaciones programadas`)
  
  // Verificar campañas activas que necesitan optimización
  const campaigns = await prisma.marketingAdCampaign.count({
    where: { organizationId, status: 'ACTIVE' }
  })
  if (campaigns > 0) tasks.push(`${campaigns} campañas activas requieren análisis`)
  
  return tasks
}

