import { prisma } from '@repo/database'
import { generateMultiFormat } from './agents/content-generator'
import { saveMemory } from './embeddings'

interface LaunchSequence {
  productId: string
  launchDate: Date
  userId: string // Necesario para crear contenido
}

export async function orchestrateLaunch(params: LaunchSequence) {
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId },
    include: {
      organization: true,
    },
  })

  if (!product) throw new Error('Product not found')

  const launchDate = new Date(params.launchDate)

  // Calcular fechas clave
  const t7 = new Date(launchDate.getTime() - 7 * 24 * 60 * 60 * 1000) // T-7 días
  const t3 = new Date(launchDate.getTime() - 3 * 24 * 60 * 60 * 1000) // T-3 días
  const t1 = new Date(launchDate.getTime() - 1 * 24 * 60 * 60 * 1000) // T-1 día
  const tPlus7 = new Date(launchDate.getTime() + 7 * 24 * 60 * 60 * 1000) // T+7 días

  // Secuencia de lanzamiento
  const sequence = [
    // T-7: Teaser campaign
    {
      date: t7,
      phase: 'teaser',
      actions: [
        {
          type: 'post' as const,
          topic: `Coming soon: ${product.name}`,
          angle: 'mystery_build_anticipation',
          hook: 'Something big is coming...',
          platform: 'instagram',
        },
        {
          type: 'email' as const,
          topic: 'Early access invitation',
          angle: 'exclusive_first_look',
          platform: 'email',
        },
      ],
    },

    // T-3: Feature reveals
    {
      date: t3,
      phase: 'reveal',
      actions: [
        {
          type: 'carousel' as const,
          topic: `${product.name} features revealed`,
          angle: 'feature_showcase',
          platform: 'instagram',
        },
        {
          type: 'video_script' as const,
          topic: 'Product demo teaser',
          angle: 'show_dont_tell',
          platform: 'tiktok',
        },
      ],
    },

    // T-1: Final countdown
    {
      date: t1,
      phase: 'countdown',
      actions: [
        {
          type: 'post' as const,
          topic: 'Launch tomorrow',
          angle: 'urgency_fomo',
          cta: 'Set reminder',
          platform: 'instagram',
        },
      ],
    },

    // T-0: LAUNCH DAY
    {
      date: launchDate,
      phase: 'launch',
      actions: [
        {
          type: 'landing_page' as const,
          topic: `${product.name} is live`,
          angle: 'grand_opening',
          platform: 'web',
        },
        {
          type: 'blog' as const,
          topic: `Introducing ${product.name}`,
          angle: 'founder_story',
          platform: 'blog',
        },
        {
          type: 'email' as const,
          topic: 'We are live!',
          angle: 'celebration_invitation',
          platform: 'email',
        },
        // TODO: Product Hunt launch
        // TODO: Social media blitz
      ],
    },

    // T+7: Results & social proof
    {
      date: tPlus7,
      phase: 'results',
      actions: [
        {
          type: 'blog' as const,
          topic: `${product.name} first week results`,
          angle: 'transparency_social_proof',
          platform: 'blog',
        },
        {
          type: 'carousel' as const,
          topic: 'Customer testimonials',
          angle: 'user_love',
          platform: 'instagram',
        },
      ],
    },
  ]

  // Crear jobs para cada fase
  const jobs = []
  for (const phase of sequence) {
    for (const action of phase.actions) {
      const job = await prisma.marketingJob.create({
        data: {
          organizationId: product.organizationId,
          name: `Launch ${phase.phase}: ${action.type}`,
          type: 'content_generation',
          status: 'pending',
          progress: 0,
          result: {
            productId: params.productId,
            launchPhase: phase.phase,
            scheduledFor: phase.date.toISOString(),
            contentTask: action,
          },
        },
      })

      jobs.push(job)
    }
  }

  // Guardar launch plan en memoria
  await saveMemory(
    product.organizationId,
    'prompt_template',
    `Launch plan para ${product.name}:

FECHA DE LANZAMIENTO: ${launchDate.toISOString()}

FASES:
${sequence.map(s => `
${s.phase.toUpperCase()} (${s.date.toLocaleDateString()}):
${s.actions.map(a => `- ${a.type}: ${a.topic}`).join('\n')}
`).join('\n')}

JOBS CREADOS: ${jobs.length}
`,
    {
      type: 'launch_plan',
      productId: params.productId,
      launchDate: launchDate.toISOString(),
    },
    9
  )

  return {
    product: product.name,
    launchDate: launchDate.toISOString(),
    phases: sequence.length,
    jobsCreated: jobs.length,
    sequence: sequence.map(s => ({
      ...s,
      date: s.date.toISOString(),
    })),
  }
}

