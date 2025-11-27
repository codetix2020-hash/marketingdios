import { z } from 'zod'
import { protectedProcedure } from '../../../orpc/procedures'
import { orchestrationCycle } from '../../../jobs/marketing/orchestration-cycle'
import { prisma } from '@repo/database'

export const triggerOrchestrationProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    try {
      // Verificar que el usuario tiene acceso a esta organización
      const member = await prisma.member.findFirst({
        where: {
          userId: context.user.id,
          organizationId: input.organizationId,
        },
      })

      if (!member) {
        throw new Error('No tienes acceso a esta organización')
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
      throw new Error('Failed to trigger orchestration')
    }
  })

