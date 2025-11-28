/**
 * Admin procedure para crear organizaciones directamente
 * (Temporal - para crear CodeTix)
 */

import { prisma } from '@repo/database'
import { z } from 'zod'
import { adminProcedure } from '../../../orpc/procedures'

export const createOrganization = adminProcedure
  .route({
    method: 'POST',
    path: '/admin/organizations',
    tags: ['Administration'],
    summary: 'Create organization',
  })
  .input(
    z.object({
      name: z.string().min(1).max(100),
      slug: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { name, slug } = input

    // Generar slug si no se proporciona
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Verificar si ya existe
    const existing = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: finalSlug },
          { name },
        ],
      },
    })

    if (existing) {
      throw new Error(`Organization with name "${name}" or slug "${finalSlug}" already exists`)
    }

    // Crear organización
    const organization = await prisma.organization.create({
      data: {
        name,
        slug: finalSlug,
        createdAt: new Date(),
      },
    })

    return organization
  })

