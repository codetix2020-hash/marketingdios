import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { saveMemory } from '../embeddings'

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

interface CompetitorAnalysis {
  productId: string
  competitorUrl?: string
  category?: string
}

export async function analyzeCompetitors(params: CompetitorAnalysis) {
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId },
    include: {
      organization: true,
    },
  })

  if (!product) throw new Error('Product not found')

  // 1. Si no hay URL, buscar competidores por categoría
  let competitorData: any

  if (params.competitorUrl) {
    // Analizar competidor específico
    // TODO: Usar Firecrawl o Jina AI para scraping
    competitorData = {
      competitors: [{
        name: 'Competitor from URL',
        url: params.competitorUrl,
        valueProposition: 'To be analyzed',
        pricing: 'To be analyzed',
        marketingChannels: [],
        keyMessages: [],
        strengths: [],
      }],
      opportunities: [],
    }
  } else {
    // Buscar competidores genéricos en la categoría
    const prompt = `
Identifica los 5 principales competidores de ${product.name}.

DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
FEATURES: ${JSON.stringify(product.features)}

Para cada competidor, identifica:
1. Nombre y URL
2. Propuesta de valor principal
3. Pricing strategy
4. Canales de marketing principales
5. Mensajes clave en su web
6. Qué hacen mejor que nosotros (gaps)

Responde en JSON:
{
  "competitors": [
    {
      "name": "",
      "url": "",
      "valueProposition": "",
      "pricing": "",
      "marketingChannels": [],
      "keyMessages": [],
      "strengths": []
    }
  ],
  "opportunities": [
    "oportunidad 1",
    "oportunidad 2"
  ]
}
`

    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    try {
      competitorData = JSON.parse(cleaned)
    } catch (error) {
      console.error('Error parsing competitor analysis:', error)
      competitorData = {
        competitors: [],
        opportunities: ['Error al analizar competidores'],
      }
    }
  }

  // 2. Guardar insights en memoria
  await saveMemory(
    product.organizationId,
    'learning',
    `Análisis competitivo para ${product.name}:

COMPETIDORES PRINCIPALES:
${JSON.stringify(competitorData.competitors || [], null, 2)}

OPORTUNIDADES DETECTADAS:
${(competitorData.opportunities || []).join('\n')}

GAPS A EXPLOTAR:
${(competitorData.competitors || []).flatMap((c: any) => c.strengths || []).join('\n')}
`,
    {
      type: 'competitor_analysis',
      productId: params.productId,
      analyzedAt: new Date().toISOString(),
    },
    8
  )

  return competitorData
}

/**
 * Análisis continuo de competidores (ejecutar semanal)
 */
export async function analyzeAllCompetitors(organizationId: string) {
  const products = await prisma.saasProduct.findMany({
    where: {
      organizationId,
      status: 'active',
    },
  })

  console.log(`🔍 Analizando competidores para ${products.length} productos...`)

  const analyses = await Promise.allSettled(
    products.map(p => analyzeCompetitors({ productId: p.id }))
  )

  const successful = analyses.filter(a => a.status === 'fulfilled').length
  const failed = analyses.filter(a => a.status === 'rejected').length

  console.log(`✅ ${successful} productos analizados, ${failed} fallaron`)

  return {
    productsAnalyzed: successful,
    totalProducts: products.length,
    analyses: analyses
      .filter(a => a.status === 'fulfilled')
      .map(a => (a as PromiseFulfilledResult<any>).value),
    errors: failed > 0 
      ? analyses
          .filter(a => a.status === 'rejected')
          .map(a => (a as PromiseRejectedResult).reason)
      : undefined,
  }
}

