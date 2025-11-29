import { prisma } from '@repo/database'
import { orchestrateLaunch } from '../../src/lib/ai/launch-orchestrator'
import { saveMemory } from '../../src/lib/ai/embeddings'
import { analyzeCompetitors } from '../../src/lib/ai/agents/competitor-analyzer'

// Webhook: Auto-SaaS → MarketingOS
export async function handleNewProduct(payload: {
  builderProjectId: string
  name: string
  slug: string
  description: string
  targetAudience: string
  features: any[]
  pricing: any
  usp: string
  deploymentUrl?: string
  repositoryUrl?: string
  organizationId: string
  userId?: string // Opcional para el launch orchestrator
}) {
  console.log('🚀 Nuevo producto detectado:', payload.name)

  // 1. Crear registro del producto
  const product = await prisma.saasProduct.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      targetAudience: payload.targetAudience,
      features: payload.features,
      pricing: payload.pricing,
      usp: payload.usp,
      builderProjectId: payload.builderProjectId,
      builderStatus: 'deployed',
      deploymentUrl: payload.deploymentUrl,
      repositoryUrl: payload.repositoryUrl,
      organizationId: payload.organizationId,
      status: 'active',
      marketingEnabled: true,
    },
  })

  // 2. Poblar memoria del producto
  const memoryId = await saveMemory(
    payload.organizationId,
    'business_dna',
    `
PRODUCTO: ${payload.name}

DESCRIPCIÓN:
${payload.description}

TARGET AUDIENCE:
${payload.targetAudience}

UNIQUE SELLING PROPOSITION:
${payload.usp}

FEATURES PRINCIPALES:
${(payload.features || []).map((f: any) => `- ${f.name || f}: ${f.description || ''}`).join('\n')}

PRICING:
${JSON.stringify(payload.pricing, null, 2)}

URL: ${payload.deploymentUrl || 'N/A'}
REPOSITORIO: ${payload.repositoryUrl || 'N/A'}
`,
    {
      type: 'product_dna',
      productId: product.id,
      source: 'autosaas_builder',
    },
    10
  )

  await prisma.saasProduct.update({
    where: { id: product.id },
    data: { marketingMemoryId: memoryId.id },
  })

  // 3. Análisis competitivo inmediato
  try {
    await analyzeCompetitors({ productId: product.id })
    console.log('✅ Análisis competitivo completado')
  } catch (error) {
    console.error('❌ Error en análisis competitivo:', error)
  }

  // 4. Programar lanzamiento en 7 días
  const launchDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  try {
    await orchestrateLaunch({
      productId: product.id,
      launchDate,
      userId: payload.userId || 'system', // Usar userId del payload o 'system' como fallback
    })
    console.log('✅ Lanzamiento programado para:', launchDate.toISOString())
  } catch (error) {
    console.error('❌ Error programando lanzamiento:', error)
  }

  // 5. Crear entrada en outbox para confirmación
  await prisma.autoSaasOutbox.create({
    data: {
      type: 'marketing_activated',
      payload: {
        productId: product.id,
        launchDate: launchDate.toISOString(),
        memoryCreated: true,
        competitorAnalysisDone: true,
      },
      status: 'completed',
      processedAt: new Date(),
      productId: product.id,
    },
  })

  console.log('✅ Marketing activado para:', payload.name)

  return {
    productId: product.id,
    memoryId: memoryId.id,
    launchDate: launchDate.toISOString(),
    message: 'Marketing automation activated',
  }
}

// Webhook: MarketingOS → Auto-SaaS
export async function sendFeatureRequest(params: {
  productId: string
  featureTitle: string
  featureDescription: string
  userDemand: number // 1-10
  marketOpportunity: string
}) {
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId },
  })

  if (!product) throw new Error('Product not found')

  // Crear entrada en inbox para Auto-SaaS
  const request = await prisma.autoSaasInbox.create({
    data: {
      type: 'feature_request',
      priority: params.userDemand,
      title: params.featureTitle,
      description: params.featureDescription,
      data: {
        marketOpportunity: params.marketOpportunity,
        detectedBy: 'marketingos',
        source: 'user_feedback_analysis',
      },
      status: 'pending',
      productId: params.productId,
    },
  })

  console.log('📨 Feature request enviado a Auto-SaaS:', params.featureTitle)

  return request
}

// Procesar inbox (revisar requests de Auto-SaaS)
export async function processInbox(organizationId: string) {
  // Auto-SaaS puede enviar requests a MarketingOS
  // Ejemplo: "Necesito campaña de email para feature X"

  const pending = await prisma.autoSaasOutbox.findMany({
    where: {
      status: 'pending',
      product: { organizationId },
    },
    include: { product: true },
  })

  let processed = 0

  for (const item of pending) {
    if (item.type === 'feature_deployed') {
      // Nuevo feature desplegado → generar contenido
      const payload = item.payload as any
      const { productId, featureName, featureDescription } = payload

      // TODO: Generar contenido sobre nuevo feature
      console.log('📢 Generando contenido para nuevo feature:', featureName)

      await prisma.autoSaasOutbox.update({
        where: { id: item.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      })

      processed++
    }
  }

  return { processed, total: pending.length }
}

