import { schedules } from '@trigger.dev/sdk/v3'
import { prisma } from '@repo/database'
import { orchestrationCycle } from './orchestration-cycle'
import { contentJobProcessor } from './content-job-processor'

// Ejecutar cada 6 horas para todas las organizaciones activas
export const orchestrationSchedule = schedules.task({
  id: 'orchestration-schedule',
  cron: '0 */6 * * *', // Cada 6 horas: 00:00, 06:00, 12:00, 18:00
  run: async () => {
    // Obtener todas las organizaciones activas
    const organizations = await prisma.organization.findMany({
      where: {
        // Podrías agregar un campo "marketingEnabled" aquí
      },
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`🚀 Ejecutando orquestación para ${organizations.length} organizaciones`)

    // Ejecutar orquestación para cada organización
    for (const org of organizations) {
      await orchestrationCycle.trigger({
        organizationId: org.id,
      })
    }

    return {
      organizationsProcessed: organizations.length,
    }
  },
})

// Ejecutar cada 5 minutos para procesar jobs pendientes
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

