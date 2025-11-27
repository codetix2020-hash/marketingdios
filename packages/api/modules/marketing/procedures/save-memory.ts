import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { saveMemory } from '../../../src/lib/ai/embeddings'
import { protectedProcedure } from '../../../orpc/procedures'

export const saveMemoryProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      type: z.enum(['business_dna', 'learning', 'trend', 'prompt_template']),
      content: z.string(),
      metadata: z.any().optional(),
      importance: z.number().min(1).max(10).optional(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const memory = await saveMemory(
        input.organizationId,
        input.type,
        input.content,
        input.metadata,
        input.importance
      )

      return {
        success: true,
        memoryId: memory.id,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save memory',
        cause: error,
      })
    }
  })

