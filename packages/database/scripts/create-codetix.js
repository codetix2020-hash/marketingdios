/**
 * Script para crear organización CodeTix usando pg directamente
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida');
  process.exit(1);
}

async function createCodeTix() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔍 Buscando organización CodeTix...\n');

    // Buscar si ya existe
    const findResult = await pool.query(`
      SELECT id, name, slug, "createdAt"
      FROM "Organization"
      WHERE slug = 'codetix' OR LOWER(name) LIKE '%codetix%'
      LIMIT 1
    `);

    if (findResult.rows.length > 0) {
      const org = findResult.rows[0];
      console.log('✅ Organización CodeTix ya existe:\n');
      console.log(`   ID:    ${org.id}`);
      console.log(`   Nombre: ${org.name}`);
      console.log(`   Slug:  ${org.slug}`);
      console.log(`   Fecha: ${new Date(org.createdAt).toISOString()}\n`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`\n🎯 ORGANIZATION ID: ${org.id}\n`);
      console.log('═══════════════════════════════════════════════════════════════');
      await pool.end();
      process.exit(0);
    }

    console.log('📝 Creando organización CodeTix...\n');

    // Crear organización
    const createResult = await pool.query(`
      INSERT INTO "Organization" (name, slug, "createdAt", "updatedAt")
      VALUES ('CodeTix', 'codetix', NOW(), NOW())
      RETURNING id, name, slug, "createdAt"
    `);

    const org = createResult.rows[0];
    console.log('✅ Organización CodeTix creada exitosamente:\n');
    console.log(`   ID:    ${org.id}`);
    console.log(`   Nombre: ${org.name}`);
    console.log(`   Slug:  ${org.slug}\n`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n🎯 ORGANIZATION ID: ${org.id}\n`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📝 Para poblar la memoria, usa:');
    console.log(`\n$env:DATABASE_URL="${DATABASE_URL.substring(0, 50)}..."`);
    console.log('$env:OPENAI_API_KEY="sk-..."');
    console.log(`npx tsx scripts/seed-memory.ts ${org.id}\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createCodeTix();

