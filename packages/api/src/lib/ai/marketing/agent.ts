/**
 * MarketingOS - Modo Dios
 * Agente de análisis y aprendizaje continuo
 * 
 * Este agente:
 * - Analiza el performance de marketing
 * - Detecta gaps en el contenido
 * - Actualiza estrategias basándose en datos
 * - Recomienda acciones específicas
 * 
 * Arquitectura:
 * - Usa IA para análisis profundo de datos
 * - Aprende de patrones históricos
 * - Genera insights accionables
 * - Se auto-optimiza continuamente
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getMarketingKpis, listMarketingContent, listMarketingAdCampaigns, createMarketingLearning, listMarketingLearnings } from "@repo/database";

export interface PerformanceAnalysis {
	overallScore: number; // 0-100
	strengths: string[];
	weaknesses: string[];
	trends: {
		metric: string;
		direction: "up" | "down" | "stable";
		change: number;
	}[];
	recommendations: {
		priority: "high" | "medium" | "low";
		action: string;
		expectedImpact: string;
	}[];
}

export interface ContentGap {
	type: "missing_content_type" | "low_engagement" | "outdated_content" | "missing_keyword";
	description: string;
	severity: "high" | "medium" | "low";
	suggestedAction: string;
}

export interface StrategyUpdate {
	area: string; // "content", "seo", "ads", "timing"
	currentStrategy: string;
	recommendedStrategy: string;
	reason: string;
	confidence: number; // 0-100
}

/**
 * Analiza el performance general de marketing
 * 
 * @param organizationId - ID de la organización
 * @param periodDays - Período de análisis en días (default: 30)
 * @returns Análisis completo del performance
 * 
 * @example
 * ```typescript
 * const analysis = await analyzePerformance("org123", 30);
 * console.log(analysis.overallScore); // 85
 * console.log(analysis.recommendations); // [...]
 * ```
 */
export async function analyzePerformance(
	organizationId: string,
	periodDays: number = 30,
): Promise<PerformanceAnalysis> {
	const endDate = new Date();
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - periodDays);

	// Recopilar datos
	const [kpis, content, campaigns, previousLearnings] = await Promise.all([
		getMarketingKpis({
			organizationId,
			startDate,
			endDate,
		}),
		listMarketingContent({
			organizationId,
			limit: 1000,
			offset: 0,
		}),
		listMarketingAdCampaigns({
			organizationId,
			limit: 1000,
			offset: 0,
		}),
		listMarketingLearnings({
			organizationId,
			limit: 50,
			offset: 0,
		}),
	]);

	// Calcular métricas básicas
	const metrics = {
		totalContent: content.length,
		publishedContent: content.filter((c) => c.status === "PUBLISHED").length,
		activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
		contentByType: {
			EMAIL: content.filter((c) => c.type === "EMAIL").length,
			POST: content.filter((c) => c.type === "POST").length,
			REEL: content.filter((c) => c.type === "REEL").length,
			BLOG: content.filter((c) => c.type === "BLOG").length,
		},
		publicationRate: content.length > 0 ? (content.filter((c) => c.status === "PUBLISHED").length / content.length) * 100 : 0,
	};

	// Analizar tendencias en KPIs
	const trends = analyzeKpiTrends(kpis);

	// Generar análisis usando IA
	const analysisPrompt = `Eres un experto analista de marketing. Analiza los siguientes datos y genera un análisis completo.

PERÍODO: ${periodDays} días (${startDate.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString("es-ES")})

MÉTRICAS:
- Contenido total: ${metrics.totalContent}
- Contenido publicado: ${metrics.publishedContent}
- Tasa de publicación: ${metrics.publicationRate.toFixed(1)}%
- Campañas activas: ${metrics.activeCampaigns}
- Contenido por tipo:
  * Emails: ${metrics.contentByType.EMAIL}
  * Posts: ${metrics.contentByType.POST}
  * Reels: ${metrics.contentByType.REEL}
  * Blogs: ${metrics.contentByType.BLOG}

TENDENCIAS:
${trends.map((t) => `- ${t.metric}: ${t.direction} (${t.change > 0 ? "+" : ""}${t.change.toFixed(1)}%)`).join("\n")}

APRENDIZAJES PREVIOS:
${previousLearnings.length > 0 ? previousLearnings.slice(0, 5).map((l) => `- ${l.eventType}`).join("\n") : "Ninguno"}

Genera un análisis JSON con:
{
  "overallScore": número 0-100,
  "strengths": ["fortaleza1", "fortaleza2", ...],
  "weaknesses": ["debilidad1", "debilidad2", ...],
  "trends": [
    {
      "metric": "nombre_metric",
      "direction": "up|down|stable",
      "change": número
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "acción específica",
      "expectedImpact": "impacto esperado"
    }
  ]
}`;

	const { text: analysisText } = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: analysisPrompt,
	});

	// Parsear respuesta
	let analysis: PerformanceAnalysis;
	try {
		const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			analysis = JSON.parse(jsonMatch[0]);
		} else {
			// Fallback si no hay JSON válido
			analysis = createDefaultAnalysis(metrics, trends);
		}
	} catch {
		analysis = createDefaultAnalysis(metrics, trends);
	}

	return analysis;
}

/**
 * Detecta gaps en el contenido
 * 
 * @param organizationId - ID de la organización
 * @returns Lista de gaps detectados
 * 
 * @example
 * ```typescript
 * const gaps = await detectContentGaps("org123");
 * gaps.forEach(gap => {
 *   console.log(`${gap.type}: ${gap.description}`);
 * });
 * ```
 */
export async function detectContentGaps(
	organizationId: string,
): Promise<ContentGap[]> {
	const content = await listMarketingContent({
		organizationId,
		limit: 1000,
		offset: 0,
	});

	const gaps: ContentGap[] = [];

	// Detectar gaps por tipo de contenido
	const contentByType = {
		EMAIL: content.filter((c) => c.type === "EMAIL").length,
		POST: content.filter((c) => c.type === "POST").length,
		REEL: content.filter((c) => c.type === "REEL").length,
		BLOG: content.filter((c) => c.type === "BLOG").length,
	};

	const totalContent = content.length;
	const avgPerType = totalContent / 4;

	// Gap: Tipo de contenido faltante
	Object.entries(contentByType).forEach(([type, count]) => {
		if (count < avgPerType * 0.5) {
			gaps.push({
				type: "missing_content_type",
				description: `Falta contenido de tipo ${type}. Solo hay ${count} vs promedio esperado de ${avgPerType.toFixed(0)}`,
				severity: count === 0 ? "high" : "medium",
				suggestedAction: `Generar más contenido de tipo ${type}`,
			});
		}
	});

	// Gap: Contenido desactualizado (más de 30 días sin actualizar)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const outdatedContent = content.filter(
		(c) => new Date(c.updatedAt) < thirtyDaysAgo && c.status === "PUBLISHED",
	);

	if (outdatedContent.length > 0) {
		gaps.push({
			type: "outdated_content",
			description: `${outdatedContent.length} piezas de contenido no se han actualizado en más de 30 días`,
			severity: outdatedContent.length > 10 ? "high" : "medium",
			suggestedAction: "Actualizar o archivar contenido desactualizado",
		});
	}

	// Gap: Baja tasa de publicación
	const publishedCount = content.filter((c) => c.status === "PUBLISHED").length;
	const publicationRate = totalContent > 0 ? (publishedCount / totalContent) * 100 : 0;

	if (publicationRate < 50 && totalContent > 10) {
		gaps.push({
			type: "low_engagement",
			description: `Solo el ${publicationRate.toFixed(1)}% del contenido está publicado`,
			severity: publicationRate < 30 ? "high" : "medium",
			suggestedAction: "Revisar y publicar contenido pendiente o mejorar la calidad del contenido generado",
		});
	}

	return gaps;
}

/**
 * Actualiza estrategias basándose en análisis de datos
 * 
 * @param organizationId - ID de la organización
 * @returns Estrategias actualizadas recomendadas
 * 
 * @example
 * ```typescript
 * const strategies = await updateStrategies("org123");
 * strategies.forEach(strategy => {
 *   console.log(`${strategy.area}: ${strategy.recommendedStrategy}`);
 * });
 * ```
 */
export async function updateStrategies(
	organizationId: string,
): Promise<StrategyUpdate[]> {
	const [analysis, gaps, learnings] = await Promise.all([
		analyzePerformance(organizationId, 30),
		detectContentGaps(organizationId),
		listMarketingLearnings({
			organizationId,
			limit: 20,
			offset: 0,
		}),
	]);

	// Generar recomendaciones de estrategia usando IA
	const strategyPrompt = `Eres un estratega de marketing. Basándote en el siguiente análisis, recomienda actualizaciones de estrategia.

ANÁLISIS DE PERFORMANCE:
- Score general: ${analysis.overallScore}/100
- Fortalezas: ${analysis.strengths.join(", ")}
- Debilidades: ${analysis.weaknesses.join(", ")}
- Recomendaciones: ${analysis.recommendations.length}

GAPS DETECTADOS:
${gaps.map((g) => `- ${g.type}: ${g.description} (${g.severity})`).join("\n")}

APRENDIZAJES:
${learnings.length > 0 ? learnings.slice(0, 5).map((l) => `- ${l.eventType}`).join("\n") : "Ninguno"}

Genera recomendaciones de estrategia en formato JSON:
[
  {
    "area": "content|seo|ads|timing",
    "currentStrategy": "estrategia actual",
    "recommendedStrategy": "estrategia recomendada",
    "reason": "razón del cambio",
    "confidence": número 0-100
  }
]`;

	const { text: strategyText } = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: strategyPrompt,
	});

	// Parsear estrategias
	let strategies: StrategyUpdate[] = [];
	try {
		const jsonMatch = strategyText.match(/\[[\s\S]*\]/);
		if (jsonMatch) {
			strategies = JSON.parse(jsonMatch[0]);
		}
	} catch {
		// Fallback: estrategias básicas
		strategies = generateDefaultStrategies(analysis, gaps);
	}

	// Guardar aprendizaje
	await createMarketingLearning({
		organizationId,
		eventType: "strategy_update",
		eventData: {
			analysis,
			gaps,
			strategies,
		},
		insights: {
			recommendedStrategies: strategies.length,
			highConfidence: strategies.filter((s) => s.confidence > 70).length,
		},
		applied: false,
	});

	return strategies;
}

/**
 * Recomienda acciones específicas basándose en el análisis
 * 
 * @param organizationId - ID de la organización
 * @returns Lista de acciones recomendadas priorizadas
 * 
 * @example
 * ```typescript
 * const actions = await recommendActions("org123");
 * actions.forEach(action => {
 *   console.log(`[${action.priority}] ${action.action}`);
 * });
 * ```
 */
export async function recommendActions(
	organizationId: string,
): Promise<Array<{
	priority: "high" | "medium" | "low";
	action: string;
	category: string;
	expectedImpact: string;
	estimatedTime: string;
}>> {
	const [analysis, gaps, strategies] = await Promise.all([
		analyzePerformance(organizationId, 30),
		detectContentGaps(organizationId),
		updateStrategies(organizationId),
	]);

	const actions: Array<{
		priority: "high" | "medium" | "low";
		action: string;
		category: string;
		expectedImpact: string;
		estimatedTime: string;
	}> = [];

	// Agregar acciones de recomendaciones de análisis
	analysis.recommendations.forEach((rec) => {
		actions.push({
			priority: rec.priority,
			action: rec.action,
			category: "performance",
			expectedImpact: rec.expectedImpact,
			estimatedTime: rec.priority === "high" ? "1-2 horas" : rec.priority === "medium" ? "2-4 horas" : "4+ horas",
		});
	});

	// Agregar acciones de gaps
	gaps.forEach((gap) => {
		actions.push({
			priority: gap.severity === "high" ? "high" : gap.severity === "medium" ? "medium" : "low",
			action: gap.suggestedAction,
			category: "content",
			expectedImpact: `Resuelve gap: ${gap.type}`,
			estimatedTime: gap.severity === "high" ? "1-3 horas" : "2-4 horas",
		});
	});

	// Agregar acciones de estrategias
	strategies
		.filter((s) => s.confidence > 60)
		.forEach((strategy) => {
			actions.push({
				priority: strategy.confidence > 80 ? "high" : "medium",
				action: `Implementar estrategia en ${strategy.area}: ${strategy.recommendedStrategy}`,
				category: "strategy",
				expectedImpact: strategy.reason,
				estimatedTime: "4-8 horas",
			});
		});

	// Ordenar por prioridad
	actions.sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});

	return actions;
}

// ==================== Funciones auxiliares ====================

/**
 * Analiza tendencias en KPIs
 */
function analyzeKpiTrends(kpis: any[]): Array<{
	metric: string;
	direction: "up" | "down" | "stable";
	change: number;
}> {
	const trends: Array<{
		metric: string;
		direction: "up" | "down" | "stable";
		change: number;
	}> = [];

	// Agrupar KPIs por métrica
	const kpisByMetric = kpis.reduce(
		(acc, kpi) => {
			if (!acc[kpi.metric]) {
				acc[kpi.metric] = [];
			}
			acc[kpi.metric].push(kpi);
			return acc;
		},
		{} as Record<string, typeof kpis>,
	);

	// Analizar cada métrica
	Object.entries(kpisByMetric).forEach(([metric, values]) => {
		if (values.length < 2) return;

		// Ordenar por fecha
		values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const firstValue = values[0].value;
		const lastValue = values[values.length - 1].value;
		const change = ((lastValue - firstValue) / firstValue) * 100;

		trends.push({
			metric,
			direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
			change,
		});
	});

	return trends;
}

/**
 * Crea análisis por defecto si falla el parsing
 */
function createDefaultAnalysis(
	metrics: any,
	trends: Array<{ metric: string; direction: string; change: number }>,
): PerformanceAnalysis {
	return {
		overallScore: metrics.publicationRate,
		strengths: metrics.publishedContent > 10 ? ["Buena cantidad de contenido publicado"] : [],
		weaknesses: metrics.publicationRate < 50 ? ["Baja tasa de publicación"] : [],
		trends,
		recommendations: [
			{
				priority: metrics.publicationRate < 50 ? "high" : "medium",
				action: "Aumentar tasa de publicación de contenido",
				expectedImpact: "Mayor visibilidad y engagement",
			},
		],
	};
}

/**
 * Genera estrategias por defecto si falla el parsing
 */
function generateDefaultStrategies(
	analysis: PerformanceAnalysis,
	gaps: ContentGap[],
): StrategyUpdate[] {
	const strategies: StrategyUpdate[] = [];

	if (gaps.some((g) => g.type === "missing_content_type")) {
		strategies.push({
			area: "content",
			currentStrategy: "Enfoque limitado en tipos de contenido",
			recommendedStrategy: "Diversificar tipos de contenido (emails, posts, reels, blogs)",
			reason: "Detectados gaps en tipos de contenido",
			confidence: 75,
		});
	}

	if (analysis.overallScore < 70) {
		strategies.push({
			area: "performance",
			currentStrategy: "Performance subóptimo",
			recommendedStrategy: "Implementar mejoras basadas en debilidades identificadas",
			reason: `Score general bajo: ${analysis.overallScore}/100`,
			confidence: 80,
		});
	}

	return strategies;
}

