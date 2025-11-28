/**
 * Script directo para obtener organizaciones usando pg
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida');
  console.log('\n💡 Usa:');
  console.log('$env:DATABASE_URL="postgresql://..."; node packages/database/scripts/get-orgs.js');
  process.exit(1);
}

async function getOrganizations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
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
      console.log('❌ No se encontraron organizaciones.\n');
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
      console.log(`\n🎯 ORGANIZATION ID: ${result.rows[0].id}\n`);
      console.log('═══════════════════════════════════════════════════════════════');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

getOrganizations();

