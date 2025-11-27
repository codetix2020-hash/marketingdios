import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { searchMemory, generateEmbedding } from './embeddings'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface OrchestrationContext {
  organizationId: string
  recentMetrics: any
  pendingTasks: string[]
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

export async function orchestrate(context: OrchestrationContext) {
  // 1. Recuperar memoria relevante
  const businessDNA = await searchMemory(
    'business identity products services tone',
    'business_dna',
    3
  )
  
  const recentLearnings = await searchMemory(
    'successful content high performing',
    'learning',
    5
  )
  
  const trendingStructures = await prisma.viralBlueprint.findMany({
    take: 10,
    orderBy: { extractedAt: 'desc' }
  })

  // 2. Construir contexto para decisión
  const orchestrationPrompt = `
Eres el Meta-Agente Orquestador de MarketingOS.

CONTEXTO DE NEGOCIO:
${businessDNA.map((m: any) => m.content).join('\n\n')}

APRENDIZAJES RECIENTES:
${recentLearnings.map((m: any) => m.content).join('\n\n')}

MÉTRICAS ÚLTIMAS 24H:
${JSON.stringify(context.recentMetrics, null, 2)}

ESTRUCTURAS VIRALES DETECTADAS:
${trendingStructures.map(t => `${t.platform}: ${t.hook}`).join('\n')}

TAREAS PENDIENTES:
${context.pendingTasks.join('\n')}

DECISIÓN REQUERIDA:
Analiza toda la información y decide:
1. ¿Qué contenido crear en las próximas 6 horas?
2. ¿Qué campañas optimizar/pausar?
3. ¿Qué tendencias incorporar?
4. ¿Qué aprendizajes aplicar?

Responde en JSON:
{
  "contentPlan": [
    {
      "type": "post/ad/email",
      "platform": "instagram/facebook/etc",
      "topic": "...",
      "viralHook": "estructura a usar",
      "priority": 1-10,
      "reasoning": "..."
    }
  ],
  "campaignActions": [
    {
      "campaignId": "...",
      "action": "optimize/pause/scale",
      "reasoning": "..."
    }
  ],
  "learningsToApply": ["..."],
  "newAutomations": ["..."]
}
`

  const decision = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: orchestrationPrompt }]
  })

  const decisionJSON = JSON.parse(decision.content[0].text)

  // 3. Guardar decisión
  await prisma.marketingDecision.create({
    data: {
      agentType: 'orchestrator',
      decision: JSON.stringify(decisionJSON),
      reasoning: 'Orchestration cycle',
      context: context,
      organizationId: context.organizationId
    }
  })

  return decisionJSON
}
