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
      const result = await orchestrate({
        organizationId: payload.organizationId,
        recentMetrics,
        pendingTasks,
      })

      // Manejar respuesta multi-tenant (con productos) o tradicional
      if ('productsOrchestrated' in result) {
        // Orquestación multi-tenant por productos
        console.log('✅ Orquestación multi-tenant completada:', {
          productsOrchestrated: result.productsOrchestrated,
          totalProducts: result.totalProducts,
        })

        let totalContentJobs = 0
        let totalOptimizations = 0

        // Procesar decisiones de cada producto
        for (const decision of result.decisions || []) {
          // Ejecutar plan de contenido
          for (const content of decision.contentPlan || []) {
            await createContentJob(payload.organizationId, content)
            totalContentJobs++
          }

          // Ejecutar optimizaciones
          for (const optimization of decision.optimizations || []) {
            await executeOptimization(payload.organizationId, optimization)
            totalOptimizations++
          }

          // Ejecutar experimentos
          for (const experiment of decision.experiments || []) {
            await createExperimentJob(payload.organizationId, experiment)
          }
        }

        return {
          success: true,
          type: 'multi-tenant',
          result,
          executed: {
            contentJobs: totalContentJobs,
            optimizations: totalOptimizations,
          },
        }
      } else {
        // Orquestación tradicional (sin productos)
        console.log('✅ Decisión tomada:', {
          contentPlanCount: result.contentPlan?.length || 0,
          optimizationsCount: result.optimizations?.length || 0,
          learningsCount: result.learningsToApply?.length || 0,
        })

        // 4. Ejecutar plan de contenido
        for (const content of result.contentPlan || []) {
          await createContentJob(payload.organizationId, content)
        }

        // 5. Ejecutar optimizaciones
        for (const optimization of result.optimizations || []) {
          await executeOptimization(payload.organizationId, optimization)
        }

        return {
          success: true,
          type: 'traditional',
          decision: result,
          executed: {
            contentJobs: result.contentPlan?.length || 0,
            optimizations: result.optimizations?.length || 0,
          },
        }
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
  // Asegurarse de que productId existe
  if (!content.productId) {
    console.warn('⚠️ Content plan sin productId, usando organizationId')
  }

  return prisma.marketingJob.create({
    data: {
      organizationId,
      name: `Generate ${content.type} for ${content.platform}${content.productId ? ` (Product: ${content.productId})` : ''}`,
      type: 'content_generation',
      status: 'pending',
      progress: 0,
      result: {
        productId: content.productId,
        contentTask: {
          productId: content.productId,
          type: content.type || 'post',
          platform: content.platform || 'instagram',
          topic: content.topic,
          angle: content.angle,
          hook: content.hook,
          cta: content.cta,
        },
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

async function createExperimentJob(organizationId: string, experiment: any) {
  // Crear job de experimento
  return prisma.marketingJob.create({
    data: {
      organizationId,
      name: `Experiment: ${experiment.hypothesis}`,
      type: 'experiment',
      status: 'pending',
      progress: 0,
      result: {
        experiment,
      },
    },
  })
}
