import { ElevenLabs } from '@elevenlabs/elevenlabs-js'
import { prisma } from '@repo/database'

let elevenLabsClient: ElevenLabsClient | null = null
let anthropicInstance: any = null

function getElevenLabsClient() {
  if (!elevenLabsClient) {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set')
    }
    elevenLabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })
  }
  return elevenLabsClient
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

interface VoiceGenerationTask {
  productId: string
  script: string
  voiceType?: 'professional' | 'friendly' | 'energetic' | 'calm'
  purpose?: 'video' | 'ad' | 'tutorial' | 'podcast'
  language?: 'en' | 'es' | 'fr' | 'de'
  userId?: string // Opcional para guardar en BD
}

// Voice IDs de ElevenLabs (voces predefinidas)
const VOICE_PROFILES: Record<string, Record<string, string>> = {
  professional: {
    male: '21m00Tcm4TlvDq8ikWAM', // Rachel - professional female
    female: '21m00Tcm4TlvDq8ikWAM',
  },
  friendly: {
    male: 'pNInz6obpgDQGcFmaJgB', // Adam - friendly male
    female: 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female
  },
  energetic: {
    male: 'VR6AewLTigWG4xSOukaG', // Arnold - energetic male
    female: 'jBpfuIE2acCO8z3wKNLl', // Gigi - energetic female
  },
  calm: {
    male: 'TxGEqnHWrfWFTfGW9XjX', // Josh - calm male
    female: 'jsCqWAovK2LkecY7zXl4', // Freya - calm female
  },
}

export async function generateVoiceover(task: VoiceGenerationTask) {
  const client = getElevenLabsClient()
  if (!client) {
    throw new Error('ElevenLabs not configured')
  }

  console.log('🎙️ Generando voiceover:', task.script.substring(0, 50))

  // 1. Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: task.productId },
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

  // 2. Seleccionar voz apropiada
  const voiceType = task.voiceType || 'professional'
  const gender = 'female' // Default, puede ser configurable
  const voiceId = VOICE_PROFILES[voiceType]?.[gender] || VOICE_PROFILES.professional.female

  console.log('🗣️ Usando voz:', voiceType, gender)

  // 3. Optimizar script para voz (si es muy largo o tiene URLs)
  const optimizedScript = optimizeScriptForVoice(task.script)

  // 4. Obtener userId (del task o del primer miembro de la organización)
  const userId = task.userId || product.organization.members[0]?.userId || 'system'

  // 5. Generar audio con ElevenLabs
  const audio = await client.textToSpeech.convert(voiceId, {
    text: optimizedScript,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    },
  })

  // 6. Convertir stream a buffer
  const chunks: Buffer[] = []
  for await (const chunk of audio) {
    chunks.push(Buffer.from(chunk))
  }
  const audioBuffer = Buffer.concat(chunks)

  // 7. Guardar en BD (como base64 por ahora, idealmente subir a S3)
  const audioBase64 = audioBuffer.toString('base64')

  const saved = await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      userId,
      productId: task.productId,
      type: 'REEL', // Usar REEL para contenido de audio/video
      platform: task.purpose || 'video',
      title: task.script.substring(0, 100),
      content: JSON.stringify({
        script: optimizedScript,
        originalScript: task.script,
        audioBase64: audioBase64.substring(0, 1000) + '...', // Guardar solo preview
        audioSize: audioBuffer.length,
        voiceType: task.voiceType,
        voiceId,
        purpose: task.purpose,
        language: task.language || 'en',
      }),
      status: 'DRAFT',
      metadata: {
        generator: 'elevenlabs',
        voiceProfile: `${voiceType}_${gender}`,
        durationSeconds: Math.floor(audioBuffer.length / 24000), // Aproximado
      },
    },
  })

  console.log('✅ Voiceover generado:', saved.id)

  return {
    id: saved.id,
    audioBuffer,
    audioBase64,
    script: optimizedScript,
    voiceType,
    size: audioBuffer.length,
  }
}

export async function generateVideoScript(params: {
  productId: string
  topic: string
  duration: number // segundos
  style: 'tutorial' | 'promo' | 'explainer' | 'testimonial'
  userId?: string
}) {
  console.log('📝 Generando script de video:', params.topic)

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

  // 2. Calcular palabras aproximadas (150 palabras por minuto habladas)
  const targetWords = Math.floor((params.duration / 60) * 150)

  // 3. Obtener userId
  const userId = params.userId || product.organization.members[0]?.userId || 'system'

  // 4. Generar script con Claude
  const anthropic = getAnthropicClient()
  const prompt = `
Genera un script de video de ${params.duration} segundos (~${targetWords} palabras) para ${product.name}.

PRODUCTO:
${product.name} - ${product.description}
Target: ${product.targetAudience}

TEMA: ${params.topic}
ESTILO: ${params.style}
DURACIÓN: ${params.duration} segundos

ESTRUCTURA según estilo:

${params.style === 'tutorial' ? `
- Intro (5s): "En este video aprenderás..."
- Paso 1 (15s)
- Paso 2 (15s)
- Paso 3 (15s)
- Cierre (10s): "Ya estás listo para..."
` : ''}

${params.style === 'promo' ? `
- Hook (3s): Problema impactante
- Problema (7s): Amplía el dolor
- Solución (15s): Presenta el producto
- Features (20s): 3 features clave
- CTA (15s): Llamado a acción claro
` : ''}

${params.style === 'explainer' ? `
- Intro (5s): ¿Qué es ${product.name}?
- Problema (10s): El problema que resuelve
- Solución (20s): Cómo funciona
- Beneficios (15s): Por qué es mejor
- CTA (10s): Siguiente paso
` : ''}

${params.style === 'testimonial' ? `
- Intro (5s): "Conoce a [persona]..."
- Antes (10s): Situación antes del producto
- Transformación (20s): Cómo ayudó el producto
- Resultados (15s): Resultados específicos
- Recomendación (10s): Por qué lo recomienda
` : ''}

Responde SOLO con JSON:
{
  "hook": "Primera frase ultra llamativa (3-5s)",
  "script": "Script completo en párrafos cortos y naturales para VOZ",
  "scenes": [
    {
      "timestamp": "0:00-0:05",
      "narration": "Lo que se dice",
      "visual": "Qué se muestra en pantalla"
    }
  ],
  "cta": "Llamado a acción final",
  "keyPoints": ["punto 1", "punto 2", "punto 3"]
}

IMPORTANTE:
- Escribe para HABLAR, no para leer
- Usa contracciones y lenguaje natural
- Evita URLs o texto técnico difícil de pronunciar
- Marca énfasis con MAYÚSCULAS donde la voz debe enfatizar
- Incluye pausas naturales con puntos y comas
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  let scriptData: any
  try {
    scriptData = JSON.parse(cleaned)
  } catch (error) {
    console.error('Error parsing script data:', error)
    scriptData = {
      hook: 'Welcome to our product',
      script: 'This is a video script about the product.',
      scenes: [],
      cta: 'Get started today',
      keyPoints: [],
    }
  }

  // 5. Guardar script en BD
  const saved = await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      userId,
      productId: params.productId,
      type: 'REEL',
      platform: 'video',
      title: params.topic,
      content: JSON.stringify({
        ...scriptData,
        style: params.style,
        duration: params.duration,
        targetWords,
      }),
      status: 'DRAFT',
      metadata: {
        generator: 'claude-sonnet-4',
        scriptType: params.style,
      },
    },
  })

  console.log('✅ Script generado:', saved.id)

  return {
    id: saved.id,
    ...scriptData,
  }
}

export async function generateScriptAndVoice(params: {
  productId: string
  topic: string
  duration: number
  style: 'tutorial' | 'promo' | 'explainer' | 'testimonial'
  voiceType?: VoiceGenerationTask['voiceType']
  userId?: string
}) {
  console.log('🎬 Generando script + voiceover completo')

  // 1. Generar script
  const script = await generateVideoScript({
    productId: params.productId,
    topic: params.topic,
    duration: params.duration,
    style: params.style,
    userId: params.userId,
  })

  // 2. Generar voiceover del script
  const voice = await generateVoiceover({
    productId: params.productId,
    script: script.script,
    voiceType: params.voiceType,
    purpose: 'video',
    userId: params.userId,
  })

  return {
    scriptId: script.id,
    voiceId: voice.id,
    script: script.script,
    audioBuffer: voice.audioBuffer,
    scenes: script.scenes,
    hook: script.hook,
    cta: script.cta,
  }
}

/**
 * Helper: Optimizar texto para voz
 */
function optimizeScriptForVoice(text: string): string {
  let optimized = text

  // Reemplazar URLs con algo pronunciable
  optimized = optimized.replace(/https?:\/\/[^\s]+/g, 'visit our website')

  // Expandir abreviaciones comunes
  optimized = optimized
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bUI\b/g, 'U I')
    .replace(/\bUX\b/g, 'U X')
    .replace(/\bCEO\b/g, 'C E O')
    .replace(/\bCTO\b/g, 'C T O')

  // Añadir pausas naturales
  optimized = optimized.replace(/\. /g, '... ')

  return optimized
}

