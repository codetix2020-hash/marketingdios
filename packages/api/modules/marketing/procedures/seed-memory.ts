/**
 * MarketingOS - Modo Dios
 * Endpoint temporal para poblar la memoria inicial de CodeTix
 */

import { saveMemory } from '../../../src/lib/ai/embeddings'
import { prisma } from '@repo/database'
import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'

export const seedMemoryProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/marketing/brain/seed-memory',
    tags: ['Marketing', 'Brain'],
    summary: 'Seed initial memory for CodeTix',
    description: 'Populate MarketingOS memory with initial CodeTix business DNA',
  })
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const { organizationId } = input

    // Verificar acceso
    const member = await prisma.member.findFirst({
      where: {
        userId: context.user.id,
        organizationId,
        role: { in: ['admin', 'owner'] },
      },
    })

    if (!member) {
      throw new Error('Solo admins pueden poblar la memoria')
    }

    const results = []

    try {
      // 1. ADN del negocio
      const memory1 = await saveMemory(
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
        10
      )
      results.push({ type: 'business_dna', id: memory1.id, category: 'identity' })

      // 2. Productos específicos
      const memory2 = await saveMemory(
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
      results.push({ type: 'business_dna', id: memory2.id, category: 'products' })

      // 3. Casos de éxito - 70/30 Restobar
      const memory3 = await saveMemory(
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
      results.push({ type: 'learning', id: memory3.id, client: '70/30 Restobar' })

      // 4. Casos de éxito - La Quilmeña
      const memory4 = await saveMemory(
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
      results.push({ type: 'learning', id: memory4.id, client: 'La Quilmeña' })

      // 5. Estrategia de contenido
      const memory5 = await saveMemory(
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
      results.push({ type: 'prompt_template', id: memory5.id, category: 'content_strategy' })

      // 6. Competencia y posicionamiento
      const memory6 = await saveMemory(
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
      results.push({ type: 'business_dna', id: memory6.id, category: 'positioning' })

      return {
        success: true,
        message: 'Memoria poblada exitosamente',
        memoriesCreated: results.length,
        memories: results,
        summary: {
          business_dna: results.filter(r => r.type === 'business_dna').length,
          learning: results.filter(r => r.type === 'learning').length,
          prompt_template: results.filter(r => r.type === 'prompt_template').length,
        },
      }
    } catch (error) {
      console.error('Error al poblar memoria:', error)
      throw new Error(`Error al poblar memoria: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

