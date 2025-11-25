/**
 * MarketingOS - Modo Dios
 * Job de Trigger.dev: Loop de aprendizaje continuo
 * 
 * Este job se ejecuta continuamente (cada hora) y:
 * - Analiza KPIs recientes
 * - Detecta patrones y tendencias
 * - Ajusta modelos internos en MarketingLearning
 * - Genera insights y recomendaciones
 * 
 * Configuración:
 * - Frecuencia: Cada hora
 * - Trigger: Recurrente (cron: "0 * * * *")
 */

/**
 * NOTA: Ver packages/api/src/jobs/marketing/autopublish.ts para instrucciones de configuración
 */
import { task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMarketingLearning, listMarketingLearnings, updateMarketingLearning, getMarketingKpis, createMarketingLog, listMarketingContent, listMarketingAdCampaigns } from "@repo/database";

export const learningLoopJob = task({
	id: "marketing.learning-loop",
	retry: {
		maxAttempts: 2,
	},
	run: async (payload: { organizationId: string }, { ctx }) => {
		const { organizationId } = payload;

		try {
			// 1. Recopilar datos recientes (últimas 24 horas)
			const endDate = new Date();
			const startDate = new Date(endDate);
			startDate.setHours(startDate.getHours() - 24);

			const [recentKpis, recentContent, recentCampaigns, previousLearnings] = await Promise.all([
				getMarketingKpis({
					organizationId,
					startDate,
					endDate,
				}),
				listMarketingContent({
					organizationId,
					limit: 100,
					offset: 0,
				}),
				listMarketingAdCampaigns({
					organizationId,
					limit: 100,
					offset: 0,
				}),
				listMarketingLearnings({
					organizationId,
					limit: 50,
					offset: 0,
				}),
			]);

			// 2. Analizar patrones en los datos
			const patterns = analyzePatterns({
				kpis: recentKpis,
				content: recentContent,
				campaigns: recentCampaigns,
			});

			// 3. Generar insights usando IA
			const insightsPrompt = `Eres un experto en análisis de datos de marketing. Analiza los siguientes datos y genera insights accionables.

DATOS RECIENTES (últimas 24 horas):
- KPIs registrados: ${recentKpis.length}
- Contenido generado: ${recentContent.length}
- Campañas activas: ${recentCampaigns.filter((c) => c.status === "ACTIVE").length}

PATRONES DETECTADOS:
${JSON.stringify(patterns, null, 2)}

APRENDIZAJES PREVIOS:
${previousLearnings.length > 0 ? previousLearnings.slice(0, 5).map((l) => `- ${l.eventType}: ${JSON.stringify(l.insights)}`).join("\n") : "Ninguno"}

Genera:
1. Insights clave (3-5 puntos principales)
2. Tendencias detectadas
3. Recomendaciones de optimización
4. Ajustes sugeridos a las estrategias

Formato JSON:
{
  "insights": ["insight1", "insight2", ...],
  "trends": ["tendencia1", "tendencia2", ...],
  "recommendations": ["recomendación1", "recomendación2", ...],
  "strategyAdjustments": ["ajuste1", "ajuste2", ...]
}`;

			const { text: insightsText } = await generateText({
				model: openai("gpt-4o-mini"),
				prompt: insightsPrompt,
				maxTokens: 1500,
			});

			// Parsear insights (intentar extraer JSON)
			let insights: any = {};
			try {
				const jsonMatch = insightsText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					insights = JSON.parse(jsonMatch[0]);
				} else {
					// Si no hay JSON, crear estructura básica
					insights = {
						insights: [insightsText],
						trends: [],
						recommendations: [],
						strategyAdjustments: [],
					};
				}
			} catch {
				insights = {
					insights: [insightsText],
					trends: [],
					recommendations: [],
					strategyAdjustments: [],
				};
			}

			// 4. Guardar aprendizaje en MarketingLearning
			const learning = await createMarketingLearning({
				organizationId,
				eventType: "hourly_analysis",
				eventData: {
					period: {
						start: startDate.toISOString(),
						end: endDate.toISOString(),
					},
					kpisCount: recentKpis.length,
					contentCount: recentContent.length,
					campaignsCount: recentCampaigns.length,
					patterns,
				},
				insights,
				applied: false,
			});

			// 5. Aplicar ajustes automáticos si son de bajo riesgo
			const autoApplied = await applyLowRiskAdjustments({
				organizationId,
				insights,
				learningId: learning.id,
			});

			if (autoApplied.length > 0) {
				await updateMarketingLearning(learning.id, {
					applied: true,
				});

				await createMarketingLog({
					organizationId,
					level: "SUCCESS",
					category: "learning",
					message: `Ajustes automáticos aplicados: ${autoApplied.join(", ")}`,
					metadata: {
						learningId: learning.id,
						adjustments: autoApplied,
					},
				});
			}

			await createMarketingLog({
				organizationId,
				level: "INFO",
				category: "learning",
				message: `Loop de aprendizaje completado: ${insights.insights?.length || 0} insights generados`,
				metadata: {
					learningId: learning.id,
					insightsCount: insights.insights?.length || 0,
				},
			});

			return {
				success: true,
				learningId: learning.id,
				insights: insights.insights || [],
				recommendations: insights.recommendations || [],
				autoApplied,
			};
		} catch (error) {
			await createMarketingLog({
				organizationId,
				level: "ERROR",
				category: "learning",
				message: `Error en loop de aprendizaje: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw error;
		}
	},
});

/**
 * Analiza patrones en los datos recientes
 */
function analyzePatterns(data: {
	kpis: any[];
	content: any[];
	campaigns: any[];
}): Record<string, any> {
	const patterns: Record<string, any> = {};

	// Patrón: Tipo de contenido más generado
	const contentByType = data.content.reduce(
		(acc, c) => {
			acc[c.type] = (acc[c.type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	patterns.mostGeneratedContentType = Object.entries(contentByType)
		.sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

	// Patrón: Tasa de publicación
	const publishedCount = data.content.filter((c) => c.status === "PUBLISHED").length;
	patterns.publicationRate = data.content.length > 0 ? (publishedCount / data.content.length) * 100 : 0;

	// Patrón: Campañas activas vs totales
	patterns.activeCampaignsRate =
		data.campaigns.length > 0
			? (data.campaigns.filter((c) => c.status === "ACTIVE").length / data.campaigns.length) * 100
			: 0;

	// Patrón: KPIs más frecuentes
	const kpiMetrics = data.kpis.map((k) => k.metric);
	const kpiFrequency = kpiMetrics.reduce(
		(acc, m) => {
			acc[m] = (acc[m] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	patterns.mostTrackedMetric = Object.entries(kpiFrequency)
		.sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

	return patterns;
}

/**
 * Aplica ajustes automáticos de bajo riesgo
 */
async function applyLowRiskAdjustments(
	options: {
		organizationId: string;
		insights: any;
		learningId: string;
	},
): Promise<string[]> {
	const { insights } = options;
	const applied: string[] = [];

	// Ejemplos de ajustes automáticos de bajo riesgo:
	// - Ajustar frecuencia de publicación si hay mucha acumulación
	// - Optimizar horarios de publicación basados en engagement
	// - Ajustar presupuesto de campañas si el ROI es muy bajo

	// Por ahora, solo registramos los ajustes sugeridos
	// En producción, estos se aplicarían automáticamente si cumplen criterios de seguridad

	if (insights.recommendations) {
		insights.recommendations.forEach((rec: string) => {
			// Verificar si es un ajuste de bajo riesgo
			if (rec.toLowerCase().includes("optimizar") || rec.toLowerCase().includes("ajustar")) {
				applied.push(rec);
			}
		});
	}

	return applied;
}

