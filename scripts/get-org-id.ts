/**
 * Script para obtener el organizationId de CodeTix
 */

import { prisma } from '../packages/database'

async function getOrgId() {
  console.log('🔍 Buscando organización CodeTix...\n')

  try {
    const orgs = await prisma.organization.findMany({
      where: {
        OR: [
          { slug: { contains: 'codetix', mode: 'insensitive' } },
          { name: { contains: 'CodeTix', mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    })

    if (orgs.length === 0) {
      console.log('❌ No se encontró ninguna organización con nombre "CodeTix"')
      console.log('\n📋 Mostrando todas las organizaciones disponibles:\n')
      
      const allOrgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      })
      
      if (allOrgs.length === 0) {
        console.log('   (No hay organizaciones en la base de datos)')
      } else {
        allOrgs.forEach(org => {
          console.log(`   ID: ${org.id}`)
          console.log(`   Nombre: ${org.name}`)
          console.log(`   Slug: ${org.slug}`)
          console.log(`   Creada: ${org.createdAt.toISOString()}`)
          console.log('   ---')
        })
      }
    } else {
      console.log('✅ Organización(es) encontrada(s):\n')
      orgs.forEach(org => {
        console.log(`   ID: ${org.id}`)
        console.log(`   Nombre: ${org.name}`)
        console.log(`   Slug: ${org.slug}`)
        console.log(`   Creada: ${org.createdAt.toISOString()}`)
        console.log('   ---')
      })
      
      console.log('\n📝 Para poblar la memoria, usa:')
      console.log(`\nDATABASE_URL="..." OPENAI_API_KEY="..." npx tsx scripts/seed-memory.ts ${orgs[0].id}`)
    }

  } catch (error) {
    console.error('❌ Error al buscar organización:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

getOrgId().catch((error) => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})

