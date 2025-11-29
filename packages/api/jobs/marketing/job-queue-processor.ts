import { schedules } from '@trigger.dev/sdk/v3'
import { prisma } from '@repo/database'
import { contentJobProcessor } from './content-job-processor'

// Ejecutar cada 5 minutos
export const jobQueueSchedule = schedules.task({
  id: 'marketing-job-queue',
  cron: '*/5 * * * *', // Cada 5 minutos
  run: async () => {
    console.log('🔍 Buscando jobs pendientes...')

    // Obtener jobs pendientes (máximo 10 a la vez)
    const pendingJobs = await prisma.marketingJob.findMany({
      where: {
        status: 'pending',
        type: 'content_generation', // Solo procesar content generation por ahora
      },
      take: 10,
      orderBy: {
        createdAt: 'asc', // FIFO
      },
    })

    console.log(`📋 Encontrados ${pendingJobs.length} jobs pendientes`)

    if (pendingJobs.length === 0) {
      return { processed: 0 }
    }

    // Ejecutar todos en paralelo
    const results = await Promise.allSettled(
      pendingJobs.map(job =>
        contentJobProcessor.trigger({
          jobId: job.id,
        })
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`✅ Procesados: ${successful} exitosos, ${failed} fallidos`)

    return {
      processed: pendingJobs.length,
      successful,
      failed,
    }
  },
})

