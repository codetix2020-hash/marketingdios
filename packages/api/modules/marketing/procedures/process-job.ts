import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { contentJobProcessor } from '../../../jobs/marketing/content-job-processor'
import { prisma } from '@repo/database'

export const processJobProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/jobs/process',
    tags: ['Marketing', 'Jobs'],
    summary: 'Manually process a marketing job',
    description: 'Trigger the processing of a specific marketing job',
  })
  .input(
    z.object({
      jobId: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    // Verificar que el job pertenece a una organización del usuario
    const job = await prisma.marketingJob.findUnique({
      where: { id: input.jobId },
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

    if (!job || job.organization.members.length === 0) {
      throw new Error('Job not found or no access')
    }

    // Ejecutar job
    const result = await contentJobProcessor.trigger({
      jobId: input.jobId,
    })

    return {
      status: 200,
      body: {
        success: true,
        jobId: result.id,
      },
    }
  })

