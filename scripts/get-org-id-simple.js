/**
 * Script simple para obtener organizaciones usando prisma
 */

const { prisma } = require('../packages/database/prisma/client');

async function getOrgs() {
  console.log('🔍 Buscando organizaciones...\n');

  try {
    const allOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (allOrgs.length === 0) {
      console.log('❌ No hay organizaciones en la base de datos');
    } else {
      console.log(`✅ Encontradas ${allOrgs.length} organización(es):\n`);
      
      allOrgs.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name}`);
        console.log(`   ID: ${org.id}`);
        console.log(`   Slug: ${org.slug}`);
        console.log(`   Creada: ${org.createdAt.toISOString()}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════');
      console.log('📝 Para poblar la memoria de CodeTix, usa:');
      console.log('');
      console.log('$env:DATABASE_URL="postgresql://..."; $env:OPENAI_API_KEY="sk-..."; node scripts/seed-memory-simple.js ' + allOrgs[0].id);
      console.log('═══════════════════════════════════════════════════');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

getOrgs().catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});

