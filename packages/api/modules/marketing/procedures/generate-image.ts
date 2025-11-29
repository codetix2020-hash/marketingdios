import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { generateImage, generateImageVariants } from '../../../src/lib/ai/agents/visual-agent'
import { prisma } from '@repo/database'

export const generateImageProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/visual/generate',
    tags: ['Marketing', 'Visual'],
    summary: 'Generate image with Flux',
    description: 'Generate an image using Flux via Replicate',
  })
  .input(
    z.object({
      productId: z.string(),
      prompt: z.string(),
      aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).optional(),
      style: z.string().optional(),
      purpose: z.enum(['social_post', 'ad', 'landing_hero', 'blog_header']).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    // Verificar acceso al producto
    const product = await prisma.saasProduct.findUnique({
      where: { id: input.productId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: context.user.id },
            },
          },
        },
      },
    })

    if (!product || product.organization.members.length === 0) {
      throw new Error('Product not found or no access')
    }

    const result = await generateImage({
      ...input,
      userId: context.user.id,
    })

    return {
      status: 200,
      body: {
        success: true,
        ...result,
      },
    }
  })

export const generateImageVariantsProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/visual/variants',
    tags: ['Marketing', 'Visual'],
    summary: 'Generate image variants for A/B testing',
    description: 'Generate multiple image variants with different styles',
  })
  .input(
    z.object({
      productId: z.string(),
      prompt: z.string(),
      purpose: z.enum(['social_post', 'ad', 'landing_hero', 'blog_header']).optional(),
      variantCount: z.number().min(1).max(5).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const product = await prisma.saasProduct.findUnique({
      where: { id: input.productId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: context.user.id },
            },
          },
        },
      },
    })

    if (!product || product.organization.members.length === 0) {
      throw new Error('Product not found or no access')
    }

    const variants = await generateImageVariants(
      input.productId,
      input.prompt,
      input.purpose,
      input.variantCount
    )

    return {
      status: 200,
      body: {
        success: true,
        variants,
      },
    }
  })

