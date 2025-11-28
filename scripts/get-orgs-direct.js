/**
 * Script directo para obtener organizaciones usando pg
 * No requiere Prisma Client generado
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida');
  console.log('\n💡 Usa:');
  console.log('$env:DATABASE_URL="postgresql://..."; node scripts/get-orgs-direct.js');
  process.exit(1);
}

async function getOrganizations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Necesario para Neon
    },
  });

  try {
    console.log('🔍 Conectando a la base de datos...\n');

    const result = await pool.query(`
      SELECT id, name, slug, "createdAt" 
      FROM "Organization" 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('❌ No se encontraron organizaciones en la base de datos.\n');
      console.log('💡 Crea una organización primero en la aplicación.\n');
    } else {
      console.log(`✅ Encontradas ${result.rows.length} organización(es):\n`);
      console.log('═══════════════════════════════════════════════════════════════\n');

      result.rows.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name}`);
        console.log(`   ID:    ${org.id}`);
        console.log(`   Slug:  ${org.slug}`);
        console.log(`   Fecha: ${new Date(org.createdAt).toLocaleDateString('es-ES')}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('\n📝 Para poblar la memoria de MarketingOS, usa:\n');
      console.log(`$env:DATABASE_URL="${DATABASE_URL.substring(0, 30)}..."`);
      console.log('$env:OPENAI_API_KEY="sk-..."');
      console.log(`node scripts/seed-memory-simple.js ${result.rows[0].id}\n`);
      console.log('═══════════════════════════════════════════════════════════════');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:');
    console.error(error.message);
    console.error('\n💡 Verifica que:');
    console.error('1. DATABASE_URL sea correcta');
    console.error('2. La base de datos esté accesible');
    console.error('3. La tabla Organization exista');
    await pool.end();
    process.exit(1);
  }
}

getOrganizations();

