/**
 * MarketingOS - Modo Dios
 * Motor SEO que analiza, optimiza y crea contenido nuevo
 * 
 * Analiza URLs, genera recomendaciones SEO y optimiza contenido
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface SeoAnalysisOptions {
	url: string;
	content?: string;
	title?: string;
	metaDescription?: string;
	keywords?: string[];
}

export interface SeoAnalysis {
	score: number; // 0-100
	analysis: {
		title: {
			exists: boolean;
			length: number;
			score: number;
			recommendations: string[];
		};
		metaDescription: {
			exists: boolean;
			length: number;
			score: number;
			recommendations: string[];
		};
		keywords: {
			primary: string[];
			secondary: string[];
			density: Record<string, number>;
			recommendations: string[];
		};
		content: {
			wordCount: number;
			readability: number;
			score: number;
			recommendations: string[];
		};
		technical: {
			hasH1: boolean;
			hasH2: boolean;
			imageAltTags: number;
			internalLinks: number;
			externalLinks: number;
			recommendations: string[];
		};
	};
	recommendations: string[];
	optimizedContent?: string;
}

/**
 * Analiza el SEO de una URL o contenido
 */
export async function analyzeSeo(options: SeoAnalysisOptions): Promise<SeoAnalysis> {
	const { url, content, title, metaDescription, keywords = [] } = options;

	// Si no hay contenido, intentar extraerlo de la URL (esto requeriría un scraper)
	// Por ahora, asumimos que el contenido se proporciona

	const analysis = await performSeoAnalysis({
		url,
		content: content || "",
		title: title || "",
		metaDescription: metaDescription || "",
		keywords,
	});

	return analysis;
}

/**
 * Realiza el análisis SEO completo
 */
async function performSeoAnalysis(options: SeoAnalysisOptions): Promise<SeoAnalysis> {
	const { url, content, title, metaDescription, keywords } = options;

	// Análisis básico
	const wordCount = content.split(/\s+/).length;
	const hasH1 = /<h1[^>]*>.*?<\/h1>/i.test(content);
	const hasH2 = /<h2[^>]*>.*?<\/h2>/i.test(content);
	const imageAltTags = (content.match(/<img[^>]*alt=["']([^"']+)["']/gi) || []).length;
	const internalLinks = (content.match(/href=["'](?!https?:\/\/)/gi) || []).length;
	const externalLinks = (content.match(/href=["']https?:\/\/(?!.*\b(?:localhost|127\.0\.0\.1))/gi) || []).length;

	// Análisis de título
	const titleAnalysis = analyzeTitle(title);
	
	// Análisis de meta description
	const metaAnalysis = analyzeMetaDescription(metaDescription);

	// Análisis de keywords
	const keywordAnalysis = analyzeKeywords(content, keywords);

	// Análisis de contenido
	const contentAnalysis = analyzeContentQuality(content);

	// Análisis técnico
	const technicalAnalysis = {
		hasH1,
		hasH2,
		imageAltTags,
		internalLinks,
		externalLinks,
		recommendations: generateTechnicalRecommendations({
			hasH1,
			hasH2,
			imageAltTags,
			internalLinks,
			externalLinks,
		}),
	};

	// Calcular score general
	const score = calculateSeoScore({
		title: titleAnalysis.score,
		meta: metaAnalysis.score,
		keywords: keywordAnalysis.score || 70,
		content: contentAnalysis.score,
		technical: calculateTechnicalScore(technicalAnalysis),
	});

	// Generar recomendaciones generales
	const recommendations = generateGeneralRecommendations({
		titleAnalysis,
		metaAnalysis,
		keywordAnalysis,
		contentAnalysis,
		technicalAnalysis,
		score,
	});

	// Generar contenido optimizado si es necesario
	let optimizedContent: string | undefined;
	if (score < 70 && content) {
		optimizedContent = await generateOptimizedContent({
			originalContent: content,
			title,
			metaDescription,
			keywords,
			recommendations,
		});
	}

	return {
		score,
		analysis: {
			title: titleAnalysis,
			metaDescription: metaAnalysis,
			keywords: keywordAnalysis,
			content: contentAnalysis,
			technical: technicalAnalysis,
		},
		recommendations,
		optimizedContent,
	};
}

/**
 * Analiza el título SEO
 */
function analyzeTitle(title: string): SeoAnalysis["analysis"]["title"] {
	const length = title.length;
	const exists = title.length > 0;
	
	let score = 100;
	const recommendations: string[] = [];

	if (!exists) {
		score = 0;
		recommendations.push("Agrega un título SEO");
	} else {
		if (length < 30) {
			score -= 20;
			recommendations.push("El título es muy corto (recomendado: 30-60 caracteres)");
		}
		if (length > 60) {
			score -= 20;
			recommendations.push("El título es muy largo (recomendado: 30-60 caracteres)");
		}
		if (!/[A-Z]/.test(title)) {
			score -= 10;
			recommendations.push("Considera usar mayúsculas para palabras clave importantes");
		}
	}

	return {
		exists,
		length,
		score: Math.max(0, score),
		recommendations,
	};
}

/**
 * Analiza la meta description
 */
function analyzeMetaDescription(metaDescription: string): SeoAnalysis["analysis"]["metaDescription"] {
	const length = metaDescription.length;
	const exists = metaDescription.length > 0;
	
	let score = 100;
	const recommendations: string[] = [];

	if (!exists) {
		score = 0;
		recommendations.push("Agrega una meta description");
	} else {
		if (length < 120) {
			score -= 20;
			recommendations.push("La meta description es muy corta (recomendado: 120-160 caracteres)");
		}
		if (length > 160) {
			score -= 20;
			recommendations.push("La meta description es muy larga (recomendado: 120-160 caracteres)");
		}
	}

	return {
		exists,
		length,
		score: Math.max(0, score),
		recommendations,
	};
}

/**
 * Analiza keywords
 */
function analyzeKeywords(content: string, providedKeywords: string[]): SeoAnalysis["analysis"]["keywords"] {
	const contentLower = content.toLowerCase();
	const keywordDensity: Record<string, number> = {};
	
	providedKeywords.forEach((keyword) => {
		const regex = new RegExp(keyword.toLowerCase(), "gi");
		const matches = contentLower.match(regex) || [];
		const density = (matches.length / contentLower.split(/\s+/).length) * 100;
		keywordDensity[keyword] = Math.round(density * 100) / 100;
	});

	const primary = providedKeywords.slice(0, 3);
	const secondary = providedKeywords.slice(3);

	const recommendations: string[] = [];
	
	// Verificar densidad de keywords
	Object.entries(keywordDensity).forEach(([keyword, density]) => {
		if (density < 0.5) {
			recommendations.push(`Aumenta la densidad de la keyword "${keyword}" (actual: ${density}%)`);
		}
		if (density > 3) {
			recommendations.push(`Reduce la densidad de la keyword "${keyword}" (actual: ${density}%) - puede ser keyword stuffing`);
		}
	});

	return {
		primary,
		secondary,
		density: keywordDensity,
		recommendations,
	};
}

/**
 * Analiza la calidad del contenido
 */
function analyzeContentQuality(content: string): SeoAnalysis["analysis"]["content"] {
	const wordCount = content.split(/\s+/).length;
	
	// Calcular legibilidad básica (promedio de palabras por oración)
	const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
	const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
	
	let score = 100;
	const recommendations: string[] = [];

	if (wordCount < 300) {
		score -= 30;
		recommendations.push("El contenido es muy corto (recomendado: mínimo 300 palabras)");
	} else if (wordCount < 500) {
		score -= 10;
		recommendations.push("Considera expandir el contenido para mejor SEO (recomendado: 500+ palabras)");
	}

	if (avgWordsPerSentence > 20) {
		score -= 15;
		recommendations.push("Las oraciones son muy largas, considera acortarlas para mejor legibilidad");
	}

	// Calcular legibilidad (simplificado)
	const readability = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));

	return {
		wordCount,
		readability: Math.round(readability),
		score: Math.max(0, score),
		recommendations,
	};
}

/**
 * Calcula el score técnico SEO
 */
function calculateTechnicalScore(technical: SeoAnalysis["analysis"]["technical"]): number {
	let score = 100;

	if (!technical.hasH1) score -= 20;
	if (!technical.hasH2) score -= 10;
	if (technical.imageAltTags === 0) score -= 15;
	if (technical.internalLinks < 2) score -= 10;
	if (technical.externalLinks === 0) score -= 5;

	return Math.max(0, score);
}

/**
 * Genera recomendaciones técnicas
 */
function generateTechnicalRecommendations(technical: SeoAnalysis["analysis"]["technical"]): string[] {
	const recommendations: string[] = [];

	if (!technical.hasH1) {
		recommendations.push("Agrega un H1 con tu keyword principal");
	}
	if (!technical.hasH2) {
		recommendations.push("Usa H2 para estructurar el contenido");
	}
	if (technical.imageAltTags === 0) {
		recommendations.push("Agrega alt tags a las imágenes");
	}
	if (technical.internalLinks < 2) {
		recommendations.push("Agrega más enlaces internos");
	}
	if (technical.externalLinks === 0) {
		recommendations.push("Considera agregar enlaces externos a fuentes autorizadas");
	}

	return recommendations;
}

/**
 * Calcula el score SEO general
 */
function calculateSeoScore(scores: {
	title: number;
	meta: number;
	keywords: number;
	content: number;
	technical: number;
}): number {
	// Pesos para cada categoría
	const weights = {
		title: 0.2,
		meta: 0.15,
		keywords: 0.2,
		content: 0.3,
		technical: 0.15,
	};

	const totalScore =
		scores.title * weights.title +
		scores.meta * weights.meta +
		scores.keywords * weights.keywords +
		scores.content * weights.content +
		scores.technical * weights.technical;

	return Math.round(totalScore);
}

/**
 * Genera recomendaciones generales
 */
function generateGeneralRecommendations(data: {
	titleAnalysis: SeoAnalysis["analysis"]["title"];
	metaAnalysis: SeoAnalysis["analysis"]["metaDescription"];
	keywordAnalysis: SeoAnalysis["analysis"]["keywords"];
	contentAnalysis: SeoAnalysis["analysis"]["content"];
	technicalAnalysis: SeoAnalysis["analysis"]["technical"];
	score: number;
}): string[] {
	const recommendations: string[] = [];

	if (data.score < 50) {
		recommendations.push("El SEO necesita mejoras significativas. Prioriza las recomendaciones críticas.");
	} else if (data.score < 70) {
		recommendations.push("El SEO está en nivel medio. Implementa las optimizaciones sugeridas.");
	} else if (data.score < 90) {
		recommendations.push("El SEO es bueno, pero hay oportunidades de mejora.");
	} else {
		recommendations.push("¡Excelente SEO! Mantén las mejores prácticas.");
	}

	return recommendations;
}

/**
 * Genera contenido optimizado usando IA
 */
async function generateOptimizedContent(options: {
	originalContent: string;
	title?: string;
	metaDescription?: string;
	keywords: string[];
	recommendations: string[];
}): Promise<string> {
	const { originalContent, title, metaDescription, keywords, recommendations } = options;

	const prompt = `Optimiza el siguiente contenido para SEO siguiendo estas recomendaciones:
${recommendations.join("\n")}

Keywords principales: ${keywords.join(", ")}

Contenido original:
${originalContent}

${title ? `Título actual: ${title}` : ""}
${metaDescription ? `Meta description actual: ${metaDescription}` : ""}

Genera una versión optimizada del contenido que:
1. Mantenga el mensaje y valor original
2. Implemente las recomendaciones SEO
3. Incluya las keywords de forma natural
4. Mejore la estructura y legibilidad
5. Sea más atractivo para los motores de búsqueda

Solo devuelve el contenido optimizado, sin explicaciones adicionales.`;

	try {
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			prompt,
			maxTokens: 2000,
		});

		return text;
	} catch (error) {
		throw new Error(`Error generando contenido optimizado: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

