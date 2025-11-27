import OpenAI from 'openai'
import { prisma } from '@repo/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Genera embedding de un texto usando OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limite de tokens
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Calcula similitud coseno entre dos vectores
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Busca memorias similares usando embeddings
 */
export async function searchMemory(
  organizationId: string,
  query: string,
  type?: string,
  limit: number = 5
) {
  const queryEmbedding = await generateEmbedding(query)
  
  // Obtener todas las memorias del tipo especificado
  const memories = await prisma.marketingMemory.findMany({
    where: {
      organizationId,
      ...(type && { type }),
    },
    select: {
      id: true,
      type: true,
      content: true,
      embedding: true,
      metadata: true,
      importance: true,
      createdAt: true,
    },
  })

  // Calcular similitud para cada memoria
  const memoriesWithSimilarity = memories
    .filter(m => m.embedding && Array.isArray(m.embedding))
    .map(memory => ({
      ...memory,
      similarity: cosineSimilarity(queryEmbedding, memory.embedding as number[]),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return memoriesWithSimilarity
}

/**
 * Guarda una memoria con su embedding
 */
export async function saveMemory(
  organizationId: string,
  type: string,
  content: string,
  metadata?: any,
  importance: number = 5
) {
  const embedding = await generateEmbedding(content)
  
  return prisma.marketingMemory.create({
    data: {
      organizationId,
      type,
      content,
      embedding,
      metadata,
      importance,
    },
  })
}

