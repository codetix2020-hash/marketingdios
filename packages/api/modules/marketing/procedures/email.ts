import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { generateEmailSequence, sendEmail } from '../../../src/lib/ai/agents/email-agent'
import { prisma } from '@repo/database'

export const generateEmailSequenceProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/email/generate-sequence',
    tags: ['Marketing', 'Email'],
    summary: 'Generate email sequence',
    description: 'Generate a complete email sequence for a product',
  })
  .input(
    z.object({
      productId: z.string(),
      sequenceType: z.enum(['welcome', 'onboarding', 'trial_ending', 'feature_announcement', 'nurture']),
      emailCount: z.number().min(1).max(10).optional(),
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

    const result = await generateEmailSequence({
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

export const sendEmailProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/email/send',
    tags: ['Marketing', 'Email'],
    summary: 'Send email',
    description: 'Send a single email using Resend',
  })
  .input(
    z.object({
      productId: z.string(),
      recipientEmail: z.string().email(),
      recipientName: z.string().optional(),
      subject: z.string(),
      contentType: z.enum(['announcement', 'update', 'promotional', 'transactional']),
      context: z.string().optional(),
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

    const result = await sendEmail(input)

    return {
      status: 200,
      body: {
        success: true,
        ...result,
      },
    }
  })

