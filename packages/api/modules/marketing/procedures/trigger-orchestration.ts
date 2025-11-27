import { z } from 'zod'
import { protectedProcedure } from '../../../orpc/procedures'
import { orchestrationCycle } from '../../../jobs/marketing/orchestration-cycle'
import { TRPCError } from '@trpc/server'

export const triggerOrchestrationProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Verificar que el usuario tiene acceso a esta organización
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes acceso a esta organización',
        })
      }

      // Ejecutar job inmediatamente
      const result = await orchestrationCycle.trigger({
        organizationId: input.organizationId,
      })

      return {
        success: true,
        jobId: result.id,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to trigger orchestration',
        cause: error,
      })
    }
  })

