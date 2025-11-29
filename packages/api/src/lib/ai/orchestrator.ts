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
 * Orquestador específico por producto - Toma decisiones para un producto SaaS
 */
async function orchestrateProduct(productId: string) {
  // 1. Obtener info del producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: productId },
    include: {
      marketingCampaigns: {
        where: { status: 'ACTIVE' },
        take: 10,
      },
      content: {
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  // 2. Memoria específica del producto
  const productMemory = await searchMemory(
    product.organizationId,
    `${product.name} ${product.description} ${product.targetAudience}`,
    'business_dna',
    5
  )

  // 3. Estrategias que funcionaron en otros productos
  const crossLearnings = await searchMemory(
    product.organizationId,
    'successful content high engagement viral posts',
    'learning',
    10
  )

  // 4. Obtener estructuras virales recientes
  const trendingStructures = await prisma.viralBlueprint.findMany({
    where: { organizationId: product.organizationId },
    take: 10,
    orderBy: { extractedAt: 'desc' },
  })

  // 5. Prompt contextualizado al producto
  const prompt = `
Eres el Meta-Agente Orquestador para ${product.name}.

PRODUCTO:
${JSON.stringify({
  name: product.name,
  description: product.description,
  targetAudience: product.targetAudience,
  features: product.features,
  pricing: product.pricing,
  usp: product.usp,
  status: product.status,
}, null, 2)}

MEMORIA DEL PRODUCTO:
${productMemory.map(m => m.content).join('\n\n')}

APRENDIZAJES DE OTROS PRODUCTOS:
${crossLearnings.map(m => m.content).join('\n\n')}

ESTRUCTURAS VIRALES DISPONIBLES:
${trendingStructures.map(t => 
  `${t.platform.toUpperCase()}: ${t.hook}\nEstructura: ${t.structure}\nCTA: ${t.cta}`
).join('\n\n')}

CONTENIDO RECIENTE DE ESTE PRODUCTO:
${product.content.map(c => `${c.type} - ${c.title || 'Sin título'}: ${c.status}`).join('\n')}

CAMPAÑAS ACTIVAS:
${product.marketingCampaigns.map(c => `${c.name} (${c.platform}): ${c.status}`).join('\n')}

Genera plan de marketing para las próximas 24 horas para ${product.name}.

Responde SOLO con JSON válido:
{
  "contentPlan": [
    {
      "productId": "${productId}",
      "type": "post | video | email | landing_page",
      "platform": "instagram | twitter | linkedin | blog",
      "topic": "tema específico",
      "angle": "ángulo único",
      "hook": "primer línea viral",
      "cta": "call to action",
      "reasoning": "por qué ahora"
    }
  ],
  "experiments": [
    {
      "hypothesis": "qué queremos probar",
      "variants": ["variante A", "variante B"],
      "metric": "qué mediremos"
    }
  ],
  "optimizations": [
    {
      "target": "qué optimizar",
      "action": "acción específica",
      "expectedImpact": "impacto estimado"
    }
  ]
}
`

  const anthropic = getAnthropicClient()
  const decision = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  })

  // Parsear y guardar
  const response = decision.content[0].type === 'text' 
    ? decision.content[0].text 
    : ''
  const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const decisionJSON = JSON.parse(cleanResponse)

  await prisma.marketingDecision.create({
    data: {
      organizationId: product.organizationId,
      agentType: 'orchestrator',
      decision: JSON.stringify(decisionJSON),
      reasoning: `Product-specific orchestration for ${product.name}`,
      context: { productId, productName: product.name },
      executedAt: new Date(),
    },
  })

  return decisionJSON
}

/**
 * Orquestador maestro que coordina todos los productos
 */
export async function orchestrateMaster(organizationId: string) {
  // Obtener todos los productos activos
  const products = await prisma.saasProduct.findMany({
    where: {
      organizationId,
      status: 'active',
      marketingEnabled: true,
    },
  })

  console.log(`🧠 Orquestando ${products.length} productos para organización ${organizationId}...`)

  if (products.length === 0) {
    console.log('⚠️ No hay productos activos con marketing habilitado')
    return {
      productsOrchestrated: 0,
      decisions: [],
    }
  }

  // Orquestar cada producto en paralelo
  const decisions = await Promise.allSettled(
    products.map(product => orchestrateProduct(product.id))
  )

  const successful = decisions.filter(d => d.status === 'fulfilled').length
  const failed = decisions.filter(d => d.status === 'rejected').length

  console.log(`✅ ${successful} productos orquestados exitosamente`)
  if (failed > 0) {
    console.log(`❌ ${failed} productos fallaron`)
  }

  return {
    productsOrchestrated: successful,
    totalProducts: products.length,
    decisions: decisions
      .filter(d => d.status === 'fulfilled')
      .map(d => (d as PromiseFulfilledResult<any>).value),
    errors: decisions
      .filter(d => d.status === 'rejected')
      .map(d => (d as PromiseRejectedResult).reason),
  }
}

/**
 * Meta-Agente Orquestador - Toma decisiones estratégicas cada 6 horas
 * (Mantiene compatibilidad con código existente)
 */
export async function orchestrate(context: OrchestrationContext) {
  const { organizationId } = context

  // Si hay productos, usar orquestador multi-tenant
  const productCount = await prisma.saasProduct.count({
    where: {
      organizationId,
      status: 'active',
      marketingEnabled: true,
    },
  })

  if (productCount > 0) {
    console.log(`🔄 Usando orquestador multi-tenant para ${productCount} productos`)
    return await orchestrateMaster(organizationId)
  }

  // Fallback: orquestación tradicional por organización
  console.log('🔄 Usando orquestador tradicional (sin productos)')

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

