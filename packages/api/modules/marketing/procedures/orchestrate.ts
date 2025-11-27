import { z } from 'zod'
import { orchestrate } from '../../../src/lib/ai/orchestrator'
import { protectedProcedure } from '../../../orpc/procedures'

export const orchestrateProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .handler(async ({ input }) => {
    try {
      const decision = await orchestrate({
        organizationId: input.organizationId,
      })

      return {
        success: true,
        decision,
      }
    } catch (error) {
      throw new Error('Failed to execute orchestration')
    }
  })

