import OpenAI from "openai";
import { db } from "@repo/database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
	const response = await openai.embeddings.create({
		model: "text-embedding-3-small",
		input: text,
	});

	return response.data[0].embedding;
}

export async function searchMemory(
	organizationId: string,
	query: string,
	type?: string,
	limit: number = 5,
) {
	const embedding = await generateEmbedding(query);

	// Vector similarity search usando pgvector
	const embeddingStr = `[${embedding.join(",")}]`;

	const typeFilter = type ? `AND type = '${type}'` : "";

	const results = await db.$queryRawUnsafe(`
    SELECT 
      id, type, content, metadata, importance,
      1 - (embedding <=> '${embeddingStr}'::vector) as similarity
    FROM marketing_memory
    WHERE "organizationId" = '${organizationId}' ${typeFilter}
    ORDER BY embedding <=> '${embeddingStr}'::vector
    LIMIT ${limit}
  `);

	return results;
}

export async function storeMemory(params: {
	organizationId: string;
	type: string;
	content: string;
	metadata?: any;
	importance?: number;
}) {
	const embedding = await generateEmbedding(params.content);

	return await db.$executeRawUnsafe(`
    INSERT INTO marketing_memory (id, "organizationId", type, content, embedding, metadata, importance, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      '${params.organizationId}',
      '${params.type}',
      '${params.content.replace(/'/g, "''")}',
      '[${embedding.join(",")}]'::vector,
      '${JSON.stringify(params.metadata || {})}'::jsonb,
      ${params.importance || 5},
      NOW(),
      NOW()
    )
  `);
}

