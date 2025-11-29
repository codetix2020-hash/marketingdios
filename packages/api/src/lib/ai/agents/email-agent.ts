import { Resend } from 'resend'
import { prisma } from '@repo/database'
import { searchMemory } from '../embeddings'

let resendClient: Resend | null = null
let anthropicInstance: any = null

function getResendClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

function getAnthropicClient() {
  if (!anthropicInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    const Anthropic = require('@anthropic-ai/sdk').default
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicInstance
}

interface EmailSequence {
  productId: string
  sequenceType: 'welcome' | 'onboarding' | 'trial_ending' | 'feature_announcement' | 'nurture'
  emailCount?: number
  userId?: string // Opcional para guardar en BD
}

interface SingleEmail {
  productId: string
  recipientEmail: string
  recipientName?: string
  subject: string
  contentType: 'announcement' | 'update' | 'promotional' | 'transactional'
  context?: string
}

export async function generateEmailSequence(params: EmailSequence) {
  console.log('📧 Generando secuencia de emails:', params.sequenceType)

  // 1. Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId },
    include: {
      organization: {
        include: {
          members: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // 2. Obtener memoria del producto
  const memory = await searchMemory(
    product.organizationId,
    `${product.name} email marketing sequences ${params.sequenceType}`,
    'prompt_template',
    3
  )

  // 3. Templates por tipo de secuencia
  const sequenceTemplates: Record<string, any> = {
    welcome: {
      count: 3,
      emails: [
        {
          delay: 0,
          subject: 'Welcome to {product}',
          focus: 'Warm welcome, set expectations, quick win',
        },
        {
          delay: 2,
          subject: 'Get started with {product}',
          focus: 'Onboarding tips, key features, support resources',
        },
        {
          delay: 5,
          subject: 'Making the most of {product}',
          focus: 'Advanced features, success stories, community',
        },
      ],
    },
    onboarding: {
      count: 5,
      emails: [
        {
          delay: 0,
          subject: 'Step 1: Set up your account',
          focus: 'Account setup, profile completion',
        },
        {
          delay: 1,
          subject: 'Step 2: Add your first project',
          focus: 'Core feature tutorial',
        },
        {
          delay: 3,
          subject: 'Step 3: Invite your team',
          focus: 'Collaboration features',
        },
        {
          delay: 5,
          subject: 'Pro tips for {product}',
          focus: 'Advanced tips, shortcuts',
        },
        {
          delay: 7,
          subject: 'You are all set!',
          focus: 'Completion celebration, next steps',
        },
      ],
    },
    trial_ending: {
      count: 3,
      emails: [
        {
          delay: -7,
          subject: 'Your trial ends in 7 days',
          focus: 'Value recap, usage stats, upgrade CTA',
        },
        {
          delay: -3,
          subject: 'Only 3 days left in your trial',
          focus: 'Urgency, social proof, discount offer',
        },
        {
          delay: -1,
          subject: 'Last chance: Trial expires tomorrow',
          focus: 'FOMO, testimonials, easy upgrade',
        },
      ],
    },
    feature_announcement: {
      count: 1,
      emails: [
        {
          delay: 0,
          subject: 'Introducing: {feature}',
          focus: 'New feature benefits, how to use, examples',
        },
      ],
    },
    nurture: {
      count: 4,
      emails: [
        {
          delay: 0,
          subject: 'How {company} uses {product}',
          focus: 'Case study, success story',
        },
        {
          delay: 7,
          subject: 'Top 5 features you might have missed',
          focus: 'Feature highlights, tips',
        },
        {
          delay: 14,
          subject: 'Community spotlight',
          focus: 'User stories, community highlights',
        },
        {
          delay: 21,
          subject: 'Exclusive offer for you',
          focus: 'Special promotion, limited time',
        },
      ],
    },
  }

  const template = sequenceTemplates[params.sequenceType]
  const emailCount = params.emailCount || template.count

  // 4. Obtener userId (del params o del primer miembro de la organización)
  const userId = params.userId || product.organization.members[0]?.userId || 'system'

  // 5. Generar cada email de la secuencia
  const emails = []
  const anthropic = getAnthropicClient()

  for (let i = 0; i < emailCount && i < template.emails.length; i++) {
    const emailTemplate = template.emails[i]

    const prompt = `
Genera un email de marketing profesional para ${product.name}.

PRODUCTO:
${product.name} - ${product.description}
Target: ${product.targetAudience}

TIPO DE SECUENCIA: ${params.sequenceType}
EMAIL #${i + 1} de ${emailCount}
DELAY: Día ${emailTemplate.delay}

ENFOQUE: ${emailTemplate.focus}

MEMORIA RELEVANTE:
${memory.map((m: any) => m.content).join('\n\n')}

Genera el email con esta estructura JSON:

{
  "subjectLines": [
    "Opción A - directa y clara",
    "Opción B - curiosa y emocional"
  ],
  "previewText": "Preview text de 40-60 caracteres que complementa el subject",
  "body": {
    "greeting": "Personalizado con {name}",
    "opening": "Hook que conecta emocionalmente (2-3 líneas)",
    "mainContent": "Contenido principal dividido en secciones cortas con <h2> y <p>",
    "cta": {
      "text": "Texto del botón",
      "url": "{product_url}/[path]",
      "secondary": "CTA secundario opcional"
    },
    "closing": "Cierre amigable y firma",
    "ps": "P.S. opcional con insight adicional o urgencia"
  },
  "personalizationTokens": ["name", "company", "feature_used", "days_in_trial"],
  "html": "HTML completo del email (responsive, inline CSS)"
}

IMPORTANTE:
- Subject lines: uno directo, uno emocional
- Body: conversacional, párrafos cortos, scannable
- CTA: claro y accionable
- HTML: mobile-first, inline CSS, compatible con todos los clientes
- Personalización: usa tokens donde tenga sentido
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let emailData: any
    try {
      emailData = JSON.parse(cleaned)
    } catch (error) {
      console.error('Error parsing email data:', error)
      emailData = {
        subjectLines: [emailTemplate.subject],
        previewText: 'Email content',
        body: { greeting: 'Hello', opening: 'Welcome!', mainContent: '<p>Content</p>', cta: { text: 'Get Started', url: '#' }, closing: 'Best regards' },
        personalizationTokens: [],
        html: '<p>Email content</p>',
      }
    }

    // Guardar email en BD
    const saved = await prisma.marketingContent.create({
      data: {
        organizationId: product.organizationId,
        userId,
        productId: params.productId,
        type: 'EMAIL',
        platform: 'email',
        title: emailData.subjectLines[0],
        content: JSON.stringify({
          ...emailData,
          sequenceType: params.sequenceType,
          sequencePosition: i + 1,
          sequenceTotal: emailCount,
          delayDays: emailTemplate.delay,
        }),
        status: 'DRAFT',
        metadata: {
          generator: 'claude-sonnet-4',
          sequenceType: params.sequenceType,
          emailIndex: i,
        },
      },
    })

    emails.push({
      id: saved.id,
      position: i + 1,
      delay: emailTemplate.delay,
      subject: emailData.subjectLines[0],
      ...emailData,
    })
  }

  console.log(`✅ Secuencia generada: ${emailCount} emails`)

  return {
    sequenceType: params.sequenceType,
    emailCount: emails.length,
    emails,
  }
}

export async function sendEmail(params: SingleEmail) {
  const resend = getResendClient()
  if (!resend) {
    throw new Error('Resend not configured')
  }

  console.log('📤 Enviando email a:', params.recipientEmail)

  // 1. Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // 2. Generar contenido del email si no está proporcionado
  let emailContent: any
  const anthropic = getAnthropicClient()

  if (params.context) {
    // Usar contexto proporcionado para generar email
    const prompt = `
Genera un email ${params.contentType} para ${product.name}.

Subject sugerido: ${params.subject}

CONTEXTO:
${params.context}

PRODUCTO:
${product.name} - ${product.description}

Responde con JSON:
{
  "subject": "${params.subject}",
  "html": "HTML completo del email",
  "text": "Versión plain text"
}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    try {
      emailContent = JSON.parse(cleaned)
    } catch (error) {
      console.error('Error parsing email content:', error)
      emailContent = {
        subject: params.subject,
        html: '<p>Email content placeholder</p>',
        text: 'Email content placeholder',
      }
    }
  } else {
    emailContent = {
      subject: params.subject,
      html: '<p>Email content placeholder</p>',
      text: 'Email content placeholder',
    }
  }

  // 3. Personalizar email si hay tokens
  const personalizedHtml = personalizeEmail(emailContent.html, {
    name: params.recipientName || 'there',
    product: product.name,
  })

  // 4. Enviar con Resend
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${product.slug}.com`
  
  const result = await resend.emails.send({
    from: `${product.name} <${fromEmail}>`,
    to: params.recipientEmail,
    subject: emailContent.subject,
    html: personalizedHtml,
    text: emailContent.text || personalizedHtml.replace(/<[^>]*>/g, ''),
    tags: [
      { name: 'product', value: product.slug },
      { name: 'type', value: params.contentType },
    ],
  })

  console.log('✅ Email enviado:', result.id)

  return {
    success: true,
    emailId: result.id,
    ...emailContent,
  }
}

/**
 * Función helper para reemplazar tokens de personalización
 */
export function personalizeEmail(
  html: string,
  tokens: Record<string, string>
): string {
  let personalized = html

  Object.entries(tokens).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    personalized = personalized.replace(regex, value)
  })

  return personalized
}

