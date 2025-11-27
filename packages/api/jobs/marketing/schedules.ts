import { schedules } from '@trigger.dev/sdk/v3'
import { prisma } from '@repo/database'
import { orchestrationCycle } from './orchestration-cycle'

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

