import OpenAI from 'openai'
import { prisma } from '@repo/database'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  
  return response.data[0].embedding
}

export async function searchMemory(
  query: string,
  type?: string,
  limit: number = 5
) {
  const embedding = await generateEmbedding(query)
  
  // Vector similarity search usando pgvector
  const results = await prisma.$queryRaw`
    SELECT 
      id, type, content, metadata, importance,
      1 - (embedding <=> ${embedding}::vector) as similarity
    FROM marketing_memory
    WHERE ${type ? `type = ${type}` : 'true'}
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${limit}
  `
  
  return results
}
