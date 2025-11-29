import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import {
  generateVoiceover,
  generateVideoScript,
  generateScriptAndVoice,
} from '../../../src/lib/ai/agents/voice-agent'
import { prisma } from '@repo/database'

export const generateVoiceoverProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/voice/generate',
    tags: ['Marketing', 'Voice'],
    summary: 'Generate voiceover with ElevenLabs',
    description: 'Generate a voiceover from a script using ElevenLabs',
  })
  .input(
    z.object({
      productId: z.string(),
      script: z.string(),
      voiceType: z.enum(['professional', 'friendly', 'energetic', 'calm']).optional(),
      purpose: z.enum(['video', 'ad', 'tutorial', 'podcast']).optional(),
      language: z.enum(['en', 'es', 'fr', 'de']).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const product = await prisma.saasProduct.findUnique({
      where: { id: input.productId },
      include: {
        organization: {
          include: {
            members: { where: { userId: context.user.id } },
          },
        },
      },
    })

    if (!product || product.organization.members.length === 0) {
      throw new Error('Product not found or no access')
    }

    const result = await generateVoiceover({
      ...input,
      userId: context.user.id,
    })

    // No enviar buffer completo al frontend (muy pesado)
    return {
      status: 200,
      body: {
        success: true,
        id: result.id,
        script: result.script,
        voiceType: result.voiceType,
        size: result.size,
        audioPreview: result.audioBase64.substring(0, 1000),
      },
    }
  })

export const generateVideoScriptProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/voice/script',
    tags: ['Marketing', 'Voice'],
    summary: 'Generate video script',
    description: 'Generate a video script with Claude',
  })
  .input(
    z.object({
      productId: z.string(),
      topic: z.string(),
      duration: z.number().min(15).max(300), // 15s a 5min
      style: z.enum(['tutorial', 'promo', 'explainer', 'testimonial']),
    })
  )
  .handler(async ({ input, context }) => {
    const product = await prisma.saasProduct.findUnique({
      where: { id: input.productId },
      include: {
        organization: {
          include: {
            members: { where: { userId: context.user.id } },
          },
        },
      },
    })

    if (!product || product.organization.members.length === 0) {
      throw new Error('Product not found or no access')
    }

    const result = await generateVideoScript({
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

export const generateScriptAndVoiceProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/voice/complete',
    tags: ['Marketing', 'Voice'],
    summary: 'Generate script and voiceover',
    description: 'Generate both script and voiceover in one call',
  })
  .input(
    z.object({
      productId: z.string(),
      topic: z.string(),
      duration: z.number().min(15).max(300),
      style: z.enum(['tutorial', 'promo', 'explainer', 'testimonial']),
      voiceType: z.enum(['professional', 'friendly', 'energetic', 'calm']).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const product = await prisma.saasProduct.findUnique({
      where: { id: input.productId },
      include: {
        organization: {
          include: {
            members: { where: { userId: context.user.id } },
          },
        },
      },
    })

    if (!product || product.organization.members.length === 0) {
      throw new Error('Product not found or no access')
    }

    const result = await generateScriptAndVoice({
      ...input,
      userId: context.user.id,
    })

    return {
      status: 200,
      body: {
        success: true,
        scriptId: result.scriptId,
        voiceId: result.voiceId,
        script: result.script,
        scenes: result.scenes,
        hook: result.hook,
        cta: result.cta,
        audioSize: result.audioBuffer.length,
      },
    }
  })

