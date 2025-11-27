import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { orchestrate } from '../../../src/lib/ai/orchestrator'
import { protectedProcedure } from '../../../orpc/procedures'

export const orchestrateProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const decision = await orchestrate({
        organizationId: input.organizationId,
      })

      return {
        success: true,
        decision,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to execute orchestration',
        cause: error,
      })
    }
  })

