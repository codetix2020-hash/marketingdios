/**
 * MarketingOS - Modo Dios
 * Motor ADS que crea campañas y optimiza resultados
 * 
 * Genera copy de anuncios, optimiza campañas y analiza performance
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface AdCampaignOptions {
	platform: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS" | "TWITTER_ADS";
	product?: string;
	service?: string;
	targetAudience?: string;
	goal: "AWARENESS" | "CONVERSIONS" | "LEADS" | "SALES" | "ENGAGEMENT";
	budget?: number;
	keywords?: string[];
	tone?: string;
}

export interface GeneratedAdCampaign {
	name: string;
	adCopy: {
		headline: string;
		description: string;
		callToAction: string;
		keywords?: string[];
	};
	targetAudience: {
		demographics?: string[];
		interests?: string[];
		behaviors?: string[];
	};
	recommendations: string[];
	estimatedPerformance?: {
		ctr: number;
		cpc: number;
		conversions: number;
	};
}

/**
 * Genera una campaña de anuncios usando IA
 */
export async function generateAdCampaign(
	options: AdCampaignOptions,
): Promise<GeneratedAdCampaign> {
	const { platform, product, service, targetAudience, goal, budget, keywords = [], tone = "professional" } = options;

	const prompt = buildAdCampaignPrompt({
		platform,
		product,
		service,
		targetAudience,
		goal,
		budget,
		keywords,
		tone,
	});

	try {
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			prompt,
			maxTokens: 1000,
		});

		const parsed = parseAdCampaignResponse(text, platform);

		// Generar recomendaciones
		const recommendations = generateAdRecommendations({
			platform,
			goal,
			budget,
			adCopy: parsed.adCopy,
		});

		// Estimar performance (valores estimados basados en mejores prácticas)
		const estimatedPerformance = estimateAdPerformance({
			platform,
			goal,
			budget,
		});

		return {
			name: parsed.name || `Campaña ${platform} - ${goal}`,
			adCopy: parsed.adCopy,
			targetAudience: parsed.targetAudience || {},
			recommendations,
			estimatedPerformance,
		};
	} catch (error) {
		throw new Error(`Error generando campaña de anuncios: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Optimiza una campaña existente basándose en performance
 */
export async function optimizeAdCampaign(options: {
	currentAdCopy: string;
	performance: {
		impressions: number;
		clicks: number;
		conversions: number;
		spend: number;
	};
	platform: AdCampaignOptions["platform"];
	goal: AdCampaignOptions["goal"];
}): Promise<{
	optimizedAdCopy: string;
	recommendations: string[];
	expectedImprovement: {
		ctr: number;
		cpc: number;
		conversions: number;
	};
}> {
	const { currentAdCopy, performance, platform, goal } = options;

	const ctr = (performance.clicks / performance.impressions) * 100;
	const cpc = performance.spend / performance.clicks;
	const conversionRate = (performance.conversions / performance.clicks) * 100;

	const prompt = `Eres un experto en optimización de campañas publicitarias. Analiza la siguiente campaña y optimízala.

Plataforma: ${platform}
Objetivo: ${goal}

Copy actual:
${currentAdCopy}

Performance actual:
- CTR: ${ctr.toFixed(2)}%
- CPC: $${cpc.toFixed(2)}
- Tasa de conversión: ${conversionRate.toFixed(2)}%
- Impresiones: ${performance.impressions}
- Clics: ${performance.clicks}
- Conversiones: ${performance.conversions}

Genera:
1. Una versión optimizada del copy
2. Recomendaciones específicas para mejorar el performance
3. Estimación de mejora esperada (CTR, CPC, conversiones)

Formato de respuesta:
OPTIMIZED_COPY:
[copy optimizado]

RECOMMENDATIONS:
- [recomendación 1]
- [recomendación 2]
...

EXPECTED_IMPROVEMENT:
CTR: [% esperado]
CPC: [$ esperado]
CONVERSIONS: [número esperado]`;

	try {
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			prompt,
			maxTokens: 1500,
		});

		const parsed = parseOptimizationResponse(text);

		return {
			optimizedAdCopy: parsed.optimizedCopy,
			recommendations: parsed.recommendations,
			expectedImprovement: parsed.expectedImprovement,
		};
	} catch (error) {
		throw new Error(`Error optimizando campaña: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Construye el prompt para generar campaña de anuncios
 */
function buildAdCampaignPrompt(options: AdCampaignOptions): string {
	const { platform, product, service, targetAudience, goal, budget, keywords, tone } = options;

	const platformInstructions = {
		GOOGLE_ADS: "Crea un anuncio de Google Ads con headline (máx 30 caracteres), description (máx 90 caracteres) y call-to-action claro.",
		FACEBOOK_ADS: "Crea un anuncio de Facebook Ads con headline atractivo, description persuasiva y call-to-action.",
		INSTAGRAM_ADS: "Crea un anuncio de Instagram Ads visual y atractivo con copy conciso y call-to-action.",
		LINKEDIN_ADS: "Crea un anuncio de LinkedIn Ads profesional con headline impactante, description detallada y call-to-action.",
		TWITTER_ADS: "Crea un anuncio de Twitter Ads conciso y directo con máximo impacto en pocas palabras.",
	};

	const goalInstructions = {
		AWARENESS: "El objetivo es aumentar el conocimiento de marca.",
		CONVERSIONS: "El objetivo es maximizar conversiones.",
		LEADS: "El objetivo es generar leads calificados.",
		SALES: "El objetivo es aumentar las ventas directas.",
		ENGAGEMENT: "El objetivo es aumentar el engagement y la interacción.",
	};

	let prompt = `Eres un experto en publicidad digital. ${platformInstructions[platform]}\n\n`;
	prompt += `${goalInstructions[goal]}\n\n`;

	if (product) {
		prompt += `Producto: ${product}\n`;
	}
	if (service) {
		prompt += `Servicio: ${service}\n`;
	}
	if (targetAudience) {
		prompt += `Audiencia objetivo: ${targetAudience}\n`;
	}
	if (budget) {
		prompt += `Presupuesto: $${budget}\n`;
	}
	if (keywords.length > 0) {
		prompt += `Keywords: ${keywords.join(", ")}\n`;
	}
	prompt += `Tono: ${tone}\n\n`;

	prompt += `Genera:
1. Nombre de la campaña
2. Headline (título del anuncio)
3. Description (descripción del anuncio)
4. Call-to-action (CTA)
5. Keywords sugeridas (si aplica)
6. Audiencia objetivo sugerida (demographics, interests, behaviors)

Formato de respuesta:
CAMPAIGN_NAME:
[nombre]

HEADLINE:
[headline]

DESCRIPTION:
[description]

CTA:
[call-to-action]

KEYWORDS:
[keyword1, keyword2, ...]

AUDIENCE:
Demographics: [demographics]
Interests: [interests]
Behaviors: [behaviors]`;

	return prompt;
}

/**
 * Parsea la respuesta de la IA para campaña de anuncios
 */
function parseAdCampaignResponse(
	text: string,
	platform: AdCampaignOptions["platform"],
): {
	name: string;
	adCopy: GeneratedAdCampaign["adCopy"];
	targetAudience?: GeneratedAdCampaign["targetAudience"];
} {
	const nameMatch = text.match(/CAMPAIGN_NAME:\s*(.+)/i);
	const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
	const descriptionMatch = text.match(/DESCRIPTION:\s*(.+)/i);
	const ctaMatch = text.match(/CTA:\s*(.+)/i);
	const keywordsMatch = text.match(/KEYWORDS:\s*(.+)/i);
	const audienceMatch = text.match(/AUDIENCE:([\s\S]*?)(?=\n\n|\n[A-Z_]+:|$)/i);

	const name = nameMatch ? nameMatch[1].trim() : `Campaña ${platform}`;
	const headline = headlineMatch ? headlineMatch[1].trim() : "";
	const description = descriptionMatch ? descriptionMatch[1].trim() : "";
	const cta = ctaMatch ? ctaMatch[1].trim() : "Más información";
	const keywords = keywordsMatch
		? keywordsMatch[1]
				.split(",")
				.map((k) => k.trim())
				.filter((k) => k.length > 0)
		: [];

	let targetAudience: GeneratedAdCampaign["targetAudience"] | undefined;
	if (audienceMatch) {
		const audienceText = audienceMatch[1];
		const demographicsMatch = audienceText.match(/Demographics:\s*(.+)/i);
		const interestsMatch = audienceText.match(/Interests:\s*(.+)/i);
		const behaviorsMatch = audienceText.match(/Behaviors:\s*(.+)/i);

		targetAudience = {
			demographics: demographicsMatch
				? demographicsMatch[1].split(",").map((d) => d.trim())
				: undefined,
			interests: interestsMatch
				? interestsMatch[1].split(",").map((i) => i.trim())
				: undefined,
			behaviors: behaviorsMatch
				? behaviorsMatch[1].split(",").map((b) => b.trim())
				: undefined,
		};
	}

	return {
		name,
		adCopy: {
			headline,
			description,
			callToAction: cta,
			keywords: keywords.length > 0 ? keywords : undefined,
		},
		targetAudience,
	};
}

/**
 * Parsea la respuesta de optimización
 */
function parseOptimizationResponse(text: string): {
	optimizedCopy: string;
	recommendations: string[];
	expectedImprovement: {
		ctr: number;
		cpc: number;
		conversions: number;
	};
} {
	const copyMatch = text.match(/OPTIMIZED_COPY:\s*([\s\S]*?)(?=\n\nRECOMMENDATIONS:|$)/i);
	const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=\n\nEXPECTED_IMPROVEMENT:|$)/i);
	const improvementMatch = text.match(/EXPECTED_IMPROVEMENT:([\s\S]*?)(?=\n\n|$)/i);

	const optimizedCopy = copyMatch ? copyMatch[1].trim() : "";
	const recommendations = recommendationsMatch
		? recommendationsMatch[1]
				.split("\n")
				.map((r) => r.replace(/^-\s*/, "").trim())
				.filter((r) => r.length > 0)
		: [];

	let expectedImprovement = {
		ctr: 0,
		cpc: 0,
		conversions: 0,
	};

	if (improvementMatch) {
		const improvementText = improvementMatch[1];
		const ctrMatch = improvementText.match(/CTR:\s*([\d.]+)/i);
		const cpcMatch = improvementText.match(/CPC:\s*\$?([\d.]+)/i);
		const conversionsMatch = improvementText.match(/CONVERSIONS:\s*([\d.]+)/i);

		expectedImprovement = {
			ctr: ctrMatch ? parseFloat(ctrMatch[1]) : 0,
			cpc: cpcMatch ? parseFloat(cpcMatch[1]) : 0,
			conversions: conversionsMatch ? parseFloat(conversionsMatch[1]) : 0,
		};
	}

	return {
		optimizedCopy,
		recommendations,
		expectedImprovement,
	};
}

/**
 * Genera recomendaciones para la campaña
 */
function generateAdRecommendations(options: {
	platform: AdCampaignOptions["platform"];
	goal: AdCampaignOptions["goal"];
	budget?: number;
	adCopy: GeneratedAdCampaign["adCopy"];
}): string[] {
	const { platform, goal, budget, adCopy } = options;
	const recommendations: string[] = [];

	// Recomendaciones por plataforma
	if (platform === "GOOGLE_ADS") {
		recommendations.push("Usa match types específicos para keywords (exact match, phrase match)");
		recommendations.push("Crea múltiples variaciones de anuncios para A/B testing");
		recommendations.push("Optimiza las landing pages para mejor Quality Score");
	}

	if (platform === "FACEBOOK_ADS" || platform === "INSTAGRAM_ADS") {
		recommendations.push("Usa imágenes o videos de alta calidad");
		recommendations.push("Segmenta la audiencia por intereses y comportamientos");
		recommendations.push("Prueba diferentes formatos (carousel, video, single image)");
	}

	if (platform === "LINKEDIN_ADS") {
		recommendations.push("Segmenta por industria, cargo y tamaño de empresa");
		recommendations.push("Usa un tono profesional y orientado a B2B");
		recommendations.push("Considera usar LinkedIn Lead Gen Forms");
	}

	// Recomendaciones por objetivo
	if (goal === "CONVERSIONS" || goal === "SALES") {
		recommendations.push("Optimiza el CTA para conversión directa");
		recommendations.push("Usa remarketing para usuarios que ya visitaron tu sitio");
	}

	if (goal === "LEADS") {
		recommendations.push("Ofrece contenido valioso a cambio del lead");
		recommendations.push("Simplifica el formulario de captura");
	}

	// Recomendaciones de presupuesto
	if (budget) {
		if (budget < 100) {
			recommendations.push("Con este presupuesto, enfócate en una audiencia muy específica");
		} else if (budget > 1000) {
			recommendations.push("Con este presupuesto, puedes hacer A/B testing agresivo");
		}
	}

	return recommendations;
}

/**
 * Estima el performance de la campaña
 */
function estimateAdPerformance(options: {
	platform: AdCampaignOptions["platform"];
	goal: AdCampaignOptions["goal"];
	budget?: number;
}): {
	ctr: number;
	cpc: number;
	conversions: number;
} {
	const { platform, goal, budget = 100 } = options;

	// Valores estimados basados en benchmarks de la industria
	const platformBenchmarks = {
		GOOGLE_ADS: { avgCtr: 3.17, avgCpc: 2.69 },
		FACEBOOK_ADS: { avgCtr: 0.9, avgCpc: 1.72 },
		INSTAGRAM_ADS: { avgCtr: 0.8, avgCpc: 1.5 },
		LINKEDIN_ADS: { avgCtr: 0.6, avgCpc: 5.26 },
		TWITTER_ADS: { avgCtr: 1.5, avgCpc: 0.38 },
	};

	const goalConversionRates = {
		AWARENESS: 0.5,
		CONVERSIONS: 3.0,
		LEADS: 2.5,
		SALES: 2.0,
		ENGAGEMENT: 1.5,
	};

	const benchmark = platformBenchmarks[platform];
	const conversionRate = goalConversionRates[goal];

	const estimatedCtr = benchmark.avgCtr;
	const estimatedCpc = benchmark.avgCpc;
	const estimatedClicks = Math.floor(budget / estimatedCpc);
	const estimatedConversions = Math.floor((estimatedClicks * conversionRate) / 100);

	return {
		ctr: Math.round(estimatedCtr * 100) / 100,
		cpc: Math.round(estimatedCpc * 100) / 100,
		conversions: estimatedConversions,
	};
}

