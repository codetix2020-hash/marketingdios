const { Client } = require('../packages/database/node_modules/pg');
const crypto = require('crypto');

// Función simple para generar IDs similares a nanoid
function generateId() {
  return crypto.randomBytes(12).toString('base64url').substring(0, 21);
}

const DATABASE_URL = "postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";

async function createCodeTixOrg() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // 1. Buscar usuario
    const userResult = await client.query(
      'SELECT * FROM "user" WHERE email = $1',
      ['codetix2020@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);

    // 2. Verificar si ya existe la organización
    const existingOrg = await client.query(
      'SELECT * FROM organization WHERE slug = $1',
      ['codetix']
    );

    if (existingOrg.rows.length > 0) {
      console.log('\n⚠️  La organización CodeTix ya existe');
      console.log(`   ID: ${existingOrg.rows[0].id}`);
      console.log(`   Nombre: ${existingOrg.rows[0].name}`);
      
      // Verificar membresía
      const memberResult = await client.query(
        'SELECT * FROM member WHERE "userId" = $1 AND "organizationId" = $2',
        [user.id, existingOrg.rows[0].id]
      );
      
      if (memberResult.rows.length > 0) {
        console.log(`   Usuario ya es miembro con rol: ${memberResult.rows[0].role}`);
      } else {
        console.log('   ⚠️  Usuario NO es miembro. Agregándolo...');
        
        const memberId = generateId();
        await client.query(
          `INSERT INTO member (id, "userId", "organizationId", role, "createdAt")
           VALUES ($1, $2, $3, $4, NOW())`,
          [memberId, user.id, existingOrg.rows[0].id, 'owner']
        );
        console.log(`   ✅ Usuario agregado como owner`);
      }
      return;
    }

    // 3. Crear organización
    const orgId = generateId();
    await client.query(
      `INSERT INTO organization (id, name, slug, "createdAt")
       VALUES ($1, $2, $3, NOW())`,
      [orgId, 'CodeTix', 'codetix']
    );
    console.log(`✅ Organización creada: ${orgId}`);

    // 4. Crear membresía (asociar usuario como owner)
    const memberId = generateId();
    await client.query(
      `INSERT INTO member (id, "userId", "organizationId", role, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [memberId, user.id, orgId, 'owner']
    );
    console.log(`✅ Usuario asociado como owner`);

    console.log('\n🎉 ¡Listo! Organización CodeTix creada exitosamente');
    console.log(`\n   📋 Detalles:`);
    console.log(`   • Nombre: CodeTix`);
    console.log(`   • Slug: codetix`);
    console.log(`   • Owner: ${user.name} (${user.email})`);
    console.log(`   • URL: https://tu-dominio.com/app/codetix`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.detail) console.error('   Detalle:', error.detail);
  } finally {
    await client.end();
  }
}

createCodeTixOrg();
