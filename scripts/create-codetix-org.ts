/**
 * Script para crear la organización CodeTix si no existe
 * y mostrar su organizationId
 */

import { prisma } from '../packages/database'

async function createCodeTixOrg() {
  console.log('🔍 Buscando organización CodeTix...\n')

  try {
    // Buscar si ya existe
    let org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: 'codetix' },
          { name: { contains: 'CodeTix', mode: 'insensitive' } },
        ],
      },
    })

    if (org) {
      console.log('✅ Organización CodeTix ya existe:\n')
      console.log(`   ID:    ${org.id}`)
      console.log(`   Nombre: ${org.name}`)
      console.log(`   Slug:  ${org.slug}`)
      console.log(`   Fecha: ${org.createdAt.toISOString()}\n`)
      console.log('═══════════════════════════════════════════════════════════════')
      console.log(`\n🎯 ORGANIZATION ID: ${org.id}\n`)
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('\n📝 Para poblar la memoria, usa:')
      console.log(`\n$env:DATABASE_URL="..."; $env:OPENAI_API_KEY="sk-..."; npx tsx scripts/seed-memory.ts ${org.id}\n`)
    } else {
      console.log('📝 Creando organización CodeTix...\n')

      // Crear organización
      org = await prisma.organization.create({
        data: {
          name: 'CodeTix',
          slug: 'codetix',
        },
      })

      console.log('✅ Organización CodeTix creada exitosamente:\n')
      console.log(`   ID:    ${org.id}`)
      console.log(`   Nombre: ${org.name}`)
      console.log(`   Slug:  ${org.slug}\n`)
      console.log('═══════════════════════════════════════════════════════════════')
      console.log(`\n🎯 ORGANIZATION ID: ${org.id}\n`)
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('\n📝 Para poblar la memoria, usa:')
      console.log(`\n$env:DATABASE_URL="..."; $env:OPENAI_API_KEY="sk-..."; npx tsx scripts/seed-memory.ts ${org.id}\n`)
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

createCodeTixOrg()

