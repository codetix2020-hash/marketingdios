import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { searchMemory } from '../embeddings'

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

interface ContentTask {
  productId: string
  type: 'post' | 'carousel' | 'video_script' | 'email' | 'landing_page' | 'blog'
  platform: string
  topic: string
  angle: string
  hook?: string
  cta?: string
  userId: string // Requerido por el schema
}

export async function generateContent(task: ContentTask) {
  // 1. Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: task.productId },
    include: {
      organization: true,
    },
  })

  if (!product) throw new Error('Product not found')

  // 2. Obtener memoria relevante
  const memory = await searchMemory(
    product.organizationId,
    `${task.topic} ${task.angle} ${product.name}`,
    undefined,
    3
  )

  // 3. Obtener contenido exitoso similar (usando metadata para performance)
  const successfulContent = await prisma.marketingContent.findMany({
    where: {
      productId: task.productId,
      organizationId: product.organizationId,
    },
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Filtrar por engagement en metadata si existe
  const highPerforming = successfulContent.filter((c: any) => {
    const metadata = c.metadata as any
    const performance = metadata?.performance || metadata?.engagement
    return performance && performance > 0.05 // 5% engagement rate
  })

  // 4. Template según tipo
  const templates: Record<string, string> = {
    post: `Crea un post de ${task.platform} sobre ${task.topic}.

PRODUCTO: ${product.name} - ${product.description}
TARGET: ${product.targetAudience}
ÁNGULO: ${task.angle}
HOOK: ${task.hook || 'Crea uno impactante'}
CTA: ${task.cta || 'Usa el CTA más efectivo'}

MEMORIA RELEVANTE:
${memory.map(m => m.content).join('\n')}

EJEMPLOS EXITOSOS:
${highPerforming.map((c: any) => `${c.title || 'Sin título'}\nPerformance: ${JSON.stringify(c.metadata?.performance || {})}`).join('\n\n')}

Genera:
1. Hook poderoso (primera línea)
2. Cuerpo (valor + historia)
3. CTA específico
4. 5 hashtags estratégicos

Formato: JSON con { hook, body, cta, hashtags }`,

    carousel: `Crea un carrusel de Instagram de 5-7 slides sobre ${task.topic}.

PRODUCTO: ${product.name}
ÁNGULO: ${task.angle}

Cada slide debe tener:
- Título corto (3-5 palabras)
- Contenido visual (descripción para diseñador)
- Texto complementario

Formato: JSON con array de slides: { slides: [{ title, visualDescription, text }] }`,

    video_script: `Crea guión para video corto (30-60 seg) sobre ${task.topic}.

PRODUCTO: ${product.name}
PLATAFORMA: ${task.platform}

Estructura:
- Hook (primeros 3 segundos)
- Problema (setup)
- Solución (producto)
- CTA (llamado a acción)

Incluye indicaciones visuales.

Formato: JSON con { hook, problem, solution, cta, visualNotes }`,

    email: `Crea email de ${task.angle} para ${product.name}.

TARGET: ${product.targetAudience}
OBJETIVO: ${task.topic}

Estructura:
- Subject line (A/B test - 2 opciones)
- Preview text
- Cuerpo personalizado
- CTA claro
- P.S. estratégico

Formato: JSON con { subjectLines, previewText, body, cta, ps }`,

    landing_page: `Crea estructura de landing page para ${product.name}.

FEATURE/BENEFIT: ${task.topic}
ÁNGULO: ${task.angle}

Secciones:
1. Hero (headline + subheadline + CTA)
2. Problem (dolor del usuario)
3. Solution (cómo resuelve el producto)
4. Features (3-5 principales)
5. Social proof (placeholder para testimonios)
6. Pricing CTA
7. FAQ (5 preguntas)

Formato: JSON con cada sección: { hero, problem, solution, features, socialProof, pricing, faq }`,

    blog: `Crea artículo SEO de 1500+ palabras sobre ${task.topic}.

PRODUCTO: ${product.name}
ÁNGULO: ${task.angle}

Estructura:
- Title (optimizado SEO)
- Meta description
- Introducción (problema + promesa)
- H2/H3 con contenido
- Conclusión + CTA
- Keywords principales (5-7)

Formato: Markdown completo con estructura clara`,
  }

  const template = templates[task.type]
  if (!template) {
    throw new Error(`Unsupported content type: ${task.type}`)
  }

  // 5. Generar contenido
  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{
      role: 'user',
      content: template,
    }],
  })

  const content = response.content[0].type === 'text' 
    ? response.content[0].text 
    : ''

  // 6. Parsear según formato
  let parsedContent: any
  try {
    // Limpiar markdown si existe
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsedContent = task.type === 'blog' ? cleaned : JSON.parse(cleaned)
  } catch {
    // Si falla el parse, guardar como texto
    parsedContent = task.type === 'blog' ? content : { raw: content }
  }

  // 7. Mapear tipo a enum de Prisma
  const contentTypeMap: Record<string, 'EMAIL' | 'POST' | 'REEL' | 'BLOG'> = {
    post: 'POST',
    carousel: 'POST',
    video_script: 'REEL',
    email: 'EMAIL',
    landing_page: 'POST', // Landing page como POST
    blog: 'BLOG',
  }

  const prismaType = contentTypeMap[task.type] || 'POST'

  // 8. Guardar en BD
  const contentText = typeof parsedContent === 'string' 
    ? parsedContent 
    : JSON.stringify(parsedContent, null, 2)

  const saved = await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      userId: task.userId,
      productId: task.productId,
      type: prismaType,
      title: task.topic,
      content: contentText,
      status: 'DRAFT',
      metadata: {
        platform: task.platform,
        angle: task.angle,
        hook: task.hook,
        cta: task.cta,
        originalType: task.type,
        generatedContent: parsedContent,
      },
      aiPrompt: template,
      aiModel: 'claude-sonnet-4-20250514',
    },
  })

  return {
    id: saved.id,
    type: task.type,
    prismaType,
    content: parsedContent,
  }
}

/**
 * Generar múltiples formatos de la misma idea
 */
export async function generateMultiFormat(
  productId: string,
  coreTopic: string,
  angle: string,
  userId: string,
) {
  const formats: Array<ContentTask['type']> = [
    'post',
    'carousel',
    'video_script',
    'email',
  ]

  const results = await Promise.allSettled(
    formats.map(type => generateContent({
      productId,
      type,
      platform: type === 'post' ? 'instagram' : 
                type === 'carousel' ? 'instagram' :
                type === 'video_script' ? 'tiktok' : 'email',
      topic: coreTopic,
      angle,
      userId,
    }))
  )

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value)

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason)

  return {
    coreTopic,
    angle,
    generated: successful,
    failed: failed.length > 0 ? failed : undefined,
  }
}

