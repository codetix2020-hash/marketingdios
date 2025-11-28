/**
 * Script para poblar la memoria inicial de CodeTix en MarketingOS
 * 
 * Uso:
 * DATABASE_URL="tu_database_url" OPENAI_API_KEY="tu_openai_key" npx tsx scripts/seed-memory.ts [organizationId]
 * 
 * Si no provees organizationId, intentará encontrar una organización automáticamente.
 */

import { saveMemory } from '../packages/api/src/lib/ai/embeddings'
import { prisma } from '../packages/database'

async function seedMemory() {
  console.log('🧠 Iniciando población de memoria de CodeTix...\n')

  // Obtener organizationId desde argumentos o buscar en BD
  let organizationId = process.argv[2]
  
  if (!organizationId) {
    console.log('🔍 No se proveyó organizationId, buscando en la base de datos...')
    const org = await prisma.organization.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (!org) {
      console.error('❌ No se encontró ninguna organización en la base de datos.')
      console.error('   Crea una organización primero o pasa el organizationId como argumento:')
      console.error('   npx tsx scripts/seed-memory.ts <organizationId>')
      process.exit(1)
    }
    
    organizationId = org.id
    console.log(`✅ Organización encontrada: ${org.name} (${org.id})\n`)
  }

  try {
    // 1. ADN del negocio
    console.log('📝 Guardando ADN del negocio...')
    await saveMemory(
      organizationId,
      'business_dna',
      `CodeTix es una empresa española de soluciones digitales fundada por Emiliano y Bruno.
    
Servicios principales:
- Desarrollo de páginas web custom-coded (WordPress, React, Next.js)
- Sistemas de reservas para restaurantes (alternativa a OpenTable)
- Chatbots de WhatsApp para restaurantes y negocios locales
- Automatización de procesos con IA

Clientes actuales: 8 negocios en Barcelona (restaurantes, panaderías)

Propuesta de valor: Soluciones digitales profesionales a precio justo.
Nuestros sistemas de reservas cuestan €39/mes vs €599/mes de OpenTable.

Target: Restaurantes, negocios locales en Barcelona, España.
Enfoque en El Clot y zonas cercanas.

Tono de comunicación: Profesional pero cercano, técnico pero accesible.
Hablamos en español principalmente, mostramos expertise sin ser pretenciosos.`,
      { category: 'identity' },
      10 // Máxima importancia
    )
    console.log('  ✅ ADN del negocio guardado')

    // 2. Productos específicos
    console.log('📝 Guardando información de productos...')
    await saveMemory(
      organizationId,
      'business_dna',
      `Productos de CodeTix:

1. Página Web Básica - €130
   - Diseño responsive
   - 3-5 páginas
   - Formulario de contacto
   - SEO básico

2. Página Web Premium - €320
   - Todo lo del básico
   - Integración con redes sociales
   - Blog
   - Analytics avanzado

3. Sistema de Reservas - €39/mes
   - Panel de administración
   - Gestión de mesas
   - Confirmaciones automáticas WhatsApp
   - Sin comisiones por reserva

4. Chatbot WhatsApp - €50 setup + €20/mes
   - Respuestas automáticas 24/7
   - Integración con menú
   - Toma de pedidos básica`,
      { category: 'products' },
      9
    )
    console.log('  ✅ Productos guardados')

    // 3. Casos de éxito - 70/30 Restobar
    console.log('📝 Guardando casos de éxito...')
    await saveMemory(
      organizationId,
      'learning',
      `Caso de éxito: 70/30 Restobar

Cliente muy satisfecho con su página web.
Destacaron: diseño moderno, fácil de actualizar, carga rápida.
Aumento de reservas online del 40% en primer mes.

Aprendizaje: Los restaurantes valoran mucho poder actualizar el menú ellos mismos.
Incluir CMS simple es clave.`,
      { client: '70/30 Restobar', result: 'success' },
      8
    )
    console.log('  ✅ Caso de éxito: 70/30 Restobar')

    await saveMemory(
      organizationId,
      'learning',
      `Caso de éxito: Panadería La Quilmeña

Implementamos sistema de pedidos por WhatsApp.
Reducción del 60% en llamadas telefónicas.
Cliente puede gestionar pedidos de forma organizada.

Aprendizaje: Automatización de WhatsApp tiene ROI inmediato para negocios locales.
Simple es mejor - no necesitan features complejas.`,
      { client: 'La Quilmeña', result: 'success' },
      8
    )
    console.log('  ✅ Caso de éxito: Panadería La Quilmeña')

    // 4. Estrategia de contenido
    console.log('📝 Guardando estrategia de contenido...')
    await saveMemory(
      organizationId,
      'prompt_template',
      `Estrategia de contenido para CodeTix:

Pilares de contenido:
1. Educación técnica (cómo funcionan las webs, SEO, etc)
2. Casos de uso de IA en negocios locales
3. Behind the scenes de proyectos
4. Tips para restaurantes (marketing digital)
5. Comparativas de soluciones (nosotros vs competencia)

Formatos que funcionan:
- Antes/después de webs
- Testimonios en video
- Tutoriales cortos
- Infografías con precios

Plataformas principales: Instagram, LinkedIn
Frecuencia ideal: 3-4 posts/semana`,
      { category: 'content_strategy' },
      9
    )
    console.log('  ✅ Estrategia de contenido guardada')

    // 5. Competencia y posicionamiento
    console.log('📝 Guardando posicionamiento vs competencia...')
    await saveMemory(
      organizationId,
      'business_dna',
      `Posicionamiento vs competencia:

Ventajas de CodeTix:
- Precio justo (vs agencias caras)
- Soporte en español local
- Especialización en restaurantes
- Implementación rápida (1-2 semanas vs 1-3 meses)
- Sin contratos de permanencia

Diferenciadores clave:
- Usamos IA para acelerar desarrollo (sin sacrificar calidad)
- Conocemos el mercado local de Barcelona
- Relación directa fundadores-cliente (sin intermediarios)`,
      { category: 'positioning' },
      9
    )
    console.log('  ✅ Posicionamiento guardado')

    console.log('\n✅ ¡Memoria poblada exitosamente!')
    console.log(`\n📊 Resumen:`)
    console.log(`   - 5 memorias guardadas`)
    console.log(`   - Organización: ${organizationId}`)
    console.log(`   - Tipos: business_dna (3), learning (2), prompt_template (1)`)
    console.log(`   - Embeddings generados con OpenAI`)
    
  } catch (error) {
    console.error('\n❌ Error al poblar memoria:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar script
seedMemory().catch((error) => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})

