import { task } from '@trigger.dev/sdk/v3'
import { orchestrate } from '../../src/lib/ai/orchestrator'
import { prisma } from '@repo/database'

export const orchestrationCycle = task({
  id: 'marketing-orchestration-cycle',
  // Ejecutar cada 6 horas
  run: async (payload: { organizationId: string }) => {
    console.log('🧠 Iniciando ciclo de orquestación para:', payload.organizationId)

    try {
      // 1. Obtener métricas recientes
      const recentMetrics = await getRecentMetrics(payload.organizationId)
      
      // 2. Obtener tareas pendientes
      const pendingTasks = await getPendingTasks(payload.organizationId)

      // 3. Ejecutar orquestación
      const decision = await orchestrate({
        organizationId: payload.organizationId,
        recentMetrics,
        pendingTasks,
      })

      console.log('✅ Decisión tomada:', {
        contentPlanCount: decision.contentPlan?.length || 0,
        optimizationsCount: decision.optimizations?.length || 0,
        learningsCount: decision.learningsToApply?.length || 0,
      })

      // 4. Ejecutar plan de contenido
      for (const content of decision.contentPlan || []) {
        await createContentJob(payload.organizationId, content)
      }

      // 5. Ejecutar optimizaciones
      for (const optimization of decision.optimizations || []) {
        await executeOptimization(payload.organizationId, optimization)
      }

      return {
        success: true,
        decision,
        executed: {
          contentJobs: decision.contentPlan?.length || 0,
          optimizations: decision.optimizations?.length || 0,
        },
      }
    } catch (error) {
      console.error('❌ Error en orquestación:', error)
      throw error
    }
  },
})

// Funciones auxiliares

async function getRecentMetrics(organizationId: string) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [contentCount, campaignsCount, leadsCount] = await Promise.all([
    prisma.marketingContent.count({
      where: {
        organizationId,
        createdAt: { gte: last24h },
      },
    }),
    prisma.marketingAdCampaign.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    }),
    // Aquí agregarías consultas a tu CRM/leads si tienes
    Promise.resolve(0),
  ])

  return {
    contentLast24h: contentCount,
    activeCampaigns: campaignsCount,
    leadsLast24h: leadsCount || 0,
  }
}

async function getPendingTasks(organizationId: string) {
  const pendingJobs = await prisma.marketingJob.findMany({
    where: {
      organizationId,
      status: { in: ['pending', 'running'] },
    },
    select: {
      name: true,
      type: true,
      progress: true,
    },
  })

  return pendingJobs.map(j => `${j.name} (${j.type}) - ${j.progress}%`)
}

async function createContentJob(organizationId: string, content: any) {
  // Crear job de generación de contenido
  return prisma.marketingJob.create({
    data: {
      organizationId,
      name: `Generate ${content.type} for ${content.platform}`,
      type: 'content_generation',
      status: 'pending',
      progress: 0,
      result: {
        contentPlan: content,
      },
    },
  })
}

async function executeOptimization(organizationId: string, optimization: any) {
  // Crear job de optimización
  return prisma.marketingJob.create({
    data: {
      organizationId,
      name: `Optimize: ${optimization.target}`,
      type: 'campaign_optimization',
      status: 'pending',
      progress: 0,
      result: {
        optimization,
      },
    },
  })
}
