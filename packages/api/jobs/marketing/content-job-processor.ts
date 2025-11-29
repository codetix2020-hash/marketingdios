import { task } from '@trigger.dev/sdk/v3'
import { prisma } from '@repo/database'
import { generateContent } from '../../src/lib/ai/agents/content-generator'

export const contentJobProcessor = task({
  id: 'marketing-content-job-processor',
  run: async (payload: { jobId: string }) => {
    console.log('⚙️ Procesando job:', payload.jobId)

    // 1. Obtener job de la BD
    const job = await prisma.marketingJob.findUnique({
      where: { id: payload.jobId },
      include: {
        organization: {
          include: {
            members: {
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!job) {
      throw new Error(`Job ${payload.jobId} not found`)
    }

    if (job.status !== 'pending') {
      console.log(`Job ${payload.jobId} already processed (${job.status})`)
      return { skipped: true, reason: 'Already processed' }
    }

    try {
      // 2. Marcar como running
      await prisma.marketingJob.update({
        where: { id: job.id },
        data: {
          status: 'running',
          startedAt: new Date(),
          progress: 10,
        },
      })

      // 3. Ejecutar según tipo de job
      let result

      if (job.type === 'content_generation') {
        // Extraer task del job.result
        const jobResult = job.result as any
        const contentTask = jobResult?.contentTask || jobResult?.contentPlan

        if (!contentTask) {
          throw new Error('No contentTask found in job result')
        }

        console.log('📝 Generando contenido:', contentTask.type, contentTask.topic)

        // Obtener userId de la organización (primer miembro o 'system')
        const userId = job.organization.members[0]?.userId || 'system'

        // Actualizar progreso
        await prisma.marketingJob.update({
          where: { id: job.id },
          data: { progress: 30 },
        })

        // Generar contenido
        result = await generateContent({
          productId: contentTask.productId || jobResult?.productId,
          type: contentTask.type,
          platform: contentTask.platform,
          topic: contentTask.topic,
          angle: contentTask.angle,
          hook: contentTask.hook,
          cta: contentTask.cta,
          userId, // Usar userId de la organización
        })

        await prisma.marketingJob.update({
          where: { id: job.id },
          data: { progress: 80 },
        })

        console.log('✅ Contenido generado:', result.id)
      } else if (job.type === 'campaign_optimization') {
        // TODO: Implementar optimización de campañas
        result = { message: 'Campaign optimization not yet implemented' }
      } else if (job.type === 'lead_nurturing') {
        // TODO: Implementar lead nurturing
        result = { message: 'Lead nurturing not yet implemented' }
      } else {
        throw new Error(`Unknown job type: ${job.type}`)
      }

      // 4. Marcar como completado
      await prisma.marketingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          progress: 100,
          result: result,
          completedAt: new Date(),
        },
      })

      console.log('✅ Job completado:', job.id)

      return {
        success: true,
        jobId: job.id,
        result,
      }
    } catch (error) {
      console.error('❌ Error procesando job:', error)

      // Marcar como fallido
      await prisma.marketingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })

      throw error
    }
  },
})

