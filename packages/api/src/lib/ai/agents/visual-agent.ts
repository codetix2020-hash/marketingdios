import Replicate from 'replicate'
import { prisma } from '@repo/database'
import { saveMemory } from '../embeddings'

let replicateInstance: Replicate | null = null

function getReplicateClient() {
  if (!replicateInstance) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }
    replicateInstance = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }
  return replicateInstance
}

interface ImageGenerationTask {
  productId: string
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5'
  style?: string
  purpose?: 'social_post' | 'ad' | 'landing_hero' | 'blog_header'
  userId?: string // Opcional para guardar en BD
}

export async function generateImage(task: ImageGenerationTask) {
  console.log('🎨 Generando imagen:', task.prompt)

  // 1. Obtener producto para contexto de marca
  const product = await prisma.saasProduct.findUnique({
    where: { id: task.productId },
    include: {
      organization: {
        include: {
          members: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // 2. Mejorar prompt con branding y estilo
  const enhancedPrompt = buildEnhancedPrompt(task, product)

  console.log('📝 Prompt mejorado:', enhancedPrompt)

  // 3. Generar imagen con Flux
  const replicate = getReplicateClient()
  const output = await replicate.run(
    'black-forest-labs/flux-schnell',
    {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: task.aspectRatio || '1:1',
        output_format: 'png',
        num_outputs: 1,
      },
    }
  ) as string[]

  const imageUrl = output[0]

  console.log('✅ Imagen generada:', imageUrl)

  // 4. Obtener userId (del task o del primer miembro de la organización)
  const userId = task.userId || product.organization.members[0]?.userId || 'system'

  // 5. Guardar en BD como POST con tipo IMAGE (usaremos POST para imágenes)
  const saved = await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      userId,
      productId: task.productId,
      type: 'POST', // Usar POST para imágenes
      platform: task.purpose === 'social_post' ? 'instagram' : 'web',
      title: task.prompt.substring(0, 100),
      content: JSON.stringify({
        imageUrl,
        prompt: enhancedPrompt,
        originalPrompt: task.prompt,
        aspectRatio: task.aspectRatio,
        style: task.style,
        purpose: task.purpose,
      }),
      status: 'DRAFT',
      metadata: {
        generator: 'flux-schnell',
        generatedAt: new Date().toISOString(),
        imageUrl,
        visualContent: true,
      },
    },
  })

  // 6. Si la imagen funciona bien, guardar el prompt en memoria
  await saveMemory(
    product.organizationId,
    'prompt_template',
    `Prompt exitoso para imágenes de ${product.name}:

Prompt original: ${task.prompt}
Prompt mejorado: ${enhancedPrompt}
Propósito: ${task.purpose}
Estilo: ${task.style || 'default'}

Resultado: Imagen generada exitosamente para ${task.purpose}
`,
    {
      type: 'visual_prompt',
      productId: task.productId,
      purpose: task.purpose,
    },
    7
  )

  return {
    id: saved.id,
    imageUrl,
    prompt: enhancedPrompt,
  }
}

function buildEnhancedPrompt(
  task: ImageGenerationTask,
  product: any
): string {
  const basePrompt = task.prompt

  // Estilos predefinidos según propósito
  const styleGuides: Record<string, string> = {
    social_post: 'vibrant colors, modern, eye-catching, instagram-worthy, professional photography style',
    ad: 'clean, professional, conversion-focused, high quality, advertising photography',
    landing_hero: 'hero image, wide shot, professional, premium quality, web design',
    blog_header: 'editorial style, clean, professional, readable, blog header format',
  }

  const purposeStyle = task.purpose ? styleGuides[task.purpose] : styleGuides.social_post

  // Construir prompt mejorado
  let enhanced = basePrompt

  // Agregar contexto del producto si es relevante
  if (
    basePrompt.toLowerCase().includes('product') ||
    basePrompt.toLowerCase().includes('app') ||
    basePrompt.toLowerCase().includes('software')
  ) {
    enhanced += `, representing ${product.name} - ${product.description.substring(0, 100)}`
  }

  // Agregar estilo
  enhanced += `, ${task.style || purposeStyle}`

  // Agregar directivas de calidad
  enhanced += ', high quality, professional, 4k, detailed'

  return enhanced
}

/**
 * Generar múltiples variantes para A/B testing
 */
export async function generateImageVariants(
  productId: string,
  basePrompt: string,
  purpose: ImageGenerationTask['purpose'] = 'social_post',
  variantCount: number = 3
) {
  const styleVariants = [
    'minimalist, clean, modern',
    'vibrant, colorful, energetic',
    'professional, corporate, sleek',
  ]

  const variants = await Promise.all(
    styleVariants.slice(0, variantCount).map((style) =>
      generateImage({
        productId,
        prompt: basePrompt,
        style,
        purpose,
        aspectRatio: purpose === 'social_post' ? '1:1' : '16:9',
      })
    )
  )

  return variants
}

/**
 * Generar imagen para contenido existente
 */
export async function generateImageForContent(contentId: string) {
  const content = await prisma.marketingContent.findUnique({
    where: { id: contentId },
    include: { product: true },
  })

  if (!content || !content.product) {
    throw new Error('Content or product not found')
  }

  // Extraer tema del contenido
  let topic = content.title || ''
  
  try {
    const contentData = typeof content.content === 'string' 
      ? JSON.parse(content.content) 
      : content.content
    topic = contentData.topic || contentData.hook || content.title || ''
  } catch {
    // Si no se puede parsear, usar title
    topic = content.title || ''
  }

  // Determinar propósito por tipo
  const purposeMap: Record<string, ImageGenerationTask['purpose']> = {
    POST: 'social_post',
    REEL: 'social_post',
    EMAIL: 'ad',
    BLOG: 'blog_header',
  }

  const purpose = purposeMap[content.type] || 'social_post'

  // Generar imagen
  const image = await generateImage({
    productId: content.product.id,
    prompt: `${topic} for ${content.product.name}`,
    purpose,
    aspectRatio: content.type === 'POST' ? '1:1' : '16:9',
    userId: content.userId,
  })

  // Actualizar contenido con imagen
  let currentContent: any
  try {
    currentContent = typeof content.content === 'string' 
      ? JSON.parse(content.content) 
      : content.content
  } catch {
    currentContent = {}
  }

  await prisma.marketingContent.update({
    where: { id: contentId },
    data: {
      content: JSON.stringify({
        ...currentContent,
        imageUrl: image.imageUrl,
        imageId: image.id,
      }),
      metadata: {
        ...(content.metadata as any || {}),
        imageUrl: image.imageUrl,
        imageId: image.id,
      },
    },
  })

  return image
}

