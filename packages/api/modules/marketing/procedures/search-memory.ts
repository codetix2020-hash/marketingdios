import { z } from 'zod'
import { searchMemory } from '../../../src/lib/ai/embeddings'
import { protectedProcedure } from '../../../orpc/procedures'

export const searchMemoryProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      query: z.string(),
      type: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .handler(async ({ input }) => {
    try {
      const memories = await searchMemory(
        input.organizationId,
        input.query,
        input.type,
        input.limit
      )

      return {
        memories,
      }
    } catch (error) {
      throw new Error('Failed to search memory')
    }
  })

