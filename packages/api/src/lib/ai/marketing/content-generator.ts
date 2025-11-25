/**
 * MarketingOS - Modo Dios
 * Motor de generación de contenido con IA
 * 
 * Genera contenido de marketing (emails, posts, reels, blogs) usando IA
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface ContentGenerationOptions {
	type: "EMAIL" | "POST" | "REEL" | "BLOG";
	topic: string;
	tone?: string;
	targetAudience?: string;
	length?: "short" | "medium" | "long";
	keywords?: string[];
	organizationContext?: string;
}

export interface GeneratedContent {
	title: string;
	content: string;
	metadata: {
		wordCount: number;
		keywords: string[];
		suggestedTags: string[];
		seoScore?: number;
	};
}

/**
 * Genera contenido de marketing usando IA
 */
export async function generateMarketingContent(
	options: ContentGenerationOptions,
): Promise<GeneratedContent> {
	const { type, topic, tone = "professional", targetAudience, length = "medium", keywords = [], organizationContext } = options;

	// Construir el prompt según el tipo de contenido
	const prompt = buildContentPrompt({
		type,
		topic,
		tone,
		targetAudience,
		length,
		keywords,
		organizationContext,
	});

	try {
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			prompt,
			maxTokens: getMaxTokensForType(type, length),
		});

		// Parsear la respuesta (puede incluir título y contenido)
		const parsed = parseContentResponse(text, type);

		// Calcular metadata
		const metadata = {
			wordCount: parsed.content.split(/\s+/).length,
			keywords: extractKeywords(parsed.content, keywords),
			suggestedTags: generateTags(parsed.content, topic),
		};

		return {
			title: parsed.title || topic,
			content: parsed.content,
			metadata,
		};
	} catch (error) {
		throw new Error(`Error generando contenido: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Construye el prompt según el tipo de contenido
 */
function buildContentPrompt(options: ContentGenerationOptions): string {
	const { type, topic, tone, targetAudience, length, keywords, organizationContext } = options;

	const lengthInstructions = {
		short: "Crea un contenido corto y conciso (50-100 palabras)",
		medium: "Crea un contenido de longitud media (200-400 palabras)",
		long: "Crea un contenido extenso y detallado (500-1000 palabras)",
	};

	const typeInstructions = {
		EMAIL: `Crea un email de marketing profesional. Incluye:
- Asunto atractivo
- Saludo personalizado
- Cuerpo del mensaje
- Call-to-action claro
- Despedida profesional`,
		POST: `Crea un post para redes sociales. Incluye:
- Hook inicial que capture atención
- Contenido valioso y entretenido
- Hashtags relevantes
- Formato optimizado para engagement`,
		REEL: `Crea el guion para un reel de Instagram/TikTok. Incluye:
- Hook de los primeros 3 segundos
- Estructura narrativa clara
- Puntos clave a destacar
- Call-to-action
- Sugerencias de música/tono`,
		BLOG: `Crea un artículo de blog completo. Incluye:
- Título SEO optimizado
- Introducción atractiva
- Estructura con subtítulos
- Contenido detallado y valioso
- Conclusión con call-to-action`,
	};

	let prompt = `Eres un experto en marketing digital y generación de contenido. ${typeInstructions[type]}\n\n`;
	prompt += `Tema: ${topic}\n`;
	prompt += `Tono: ${tone}\n`;
	prompt += `${lengthInstructions[length]}\n`;

	if (targetAudience) {
		prompt += `Audiencia objetivo: ${targetAudience}\n`;
	}

	if (keywords.length > 0) {
		prompt += `Keywords a incluir: ${keywords.join(", ")}\n`;
	}

	if (organizationContext) {
		prompt += `Contexto de la organización: ${organizationContext}\n`;
	}

	prompt += `\nGenera el contenido siguiendo las mejores prácticas de marketing digital y asegurándote de que sea original, atractivo y efectivo.`;

	return prompt;
}

/**
 * Obtiene el número máximo de tokens según el tipo y longitud
 */
function getMaxTokensForType(
	type: ContentGenerationOptions["type"],
	length: ContentGenerationOptions["length"],
): number {
	const baseTokens = {
		EMAIL: 500,
		POST: 300,
		REEL: 400,
		BLOG: 2000,
	};

	const lengthMultiplier = {
		short: 0.5,
		medium: 1,
		long: 2,
	};

	return Math.floor(baseTokens[type] * lengthMultiplier[length]);
}

/**
 * Parsea la respuesta de la IA en título y contenido
 */
function parseContentResponse(text: string, type: ContentGenerationOptions["type"]): { title?: string; content: string } {
	// Intentar extraer título si existe
	const titleMatch = text.match(/^(?:Título|Title|Asunto):\s*(.+)$/im);
	const title = titleMatch ? titleMatch[1].trim() : undefined;

	// Limpiar el contenido
	let content = text;
	if (title) {
		content = text.replace(/^(?:Título|Title|Asunto):\s*.+$/im, "").trim();
	}

	// Remover marcadores de formato si existen
	content = content.replace(/^#{1,6}\s+/gm, "").trim();

	return { title, content };
}

/**
 * Extrae keywords del contenido
 */
function extractKeywords(content: string, providedKeywords: string[]): string[] {
	const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
	const wordFreq = new Map<string, number>();

	words.forEach((word) => {
		wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
	});

	// Ordenar por frecuencia
	const sorted = Array.from(wordFreq.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([word]) => word);

	// Combinar con keywords proporcionadas
	return Array.from(new Set([...providedKeywords, ...sorted]));
}

/**
 * Genera tags sugeridos
 */
function generateTags(content: string, topic: string): string[] {
	const tags: string[] = [];

	// Agregar tags basados en el tema
	const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
	tags.push(...topicWords.slice(0, 3));

	// Agregar tags comunes de marketing
	const commonTags = ["marketing", "digital", "negocio", "estrategia", "contenido"];
	tags.push(...commonTags.slice(0, 2));

	return Array.from(new Set(tags)).slice(0, 5);
}

