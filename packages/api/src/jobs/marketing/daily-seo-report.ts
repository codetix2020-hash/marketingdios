/**
 * MarketingOS - Modo Dios
 * Job de Trigger.dev: Reporte SEO diario
 * 
 * Este job se ejecuta diariamente y:
 * - Analiza el rendimiento SEO de las URLs principales
 * - Genera recomendaciones de optimización
 * - Guarda los resultados en MarketingSeo
 * 
 * Configuración:
 * - Frecuencia: Diaria (una vez al día)
 * - Trigger: Recurrente (cron: "0 9 * * *" - 9 AM todos los días)
 */

/**
 * NOTA: Ver packages/api/src/jobs/marketing/autopublish.ts para instrucciones de configuración
 */
import { task } from "@trigger.dev/sdk/v3";
import { createMarketingSeo, updateMarketingSeo, createMarketingLog, listMarketingSeo } from "@repo/database";
import { analyzeSeo } from "../../lib/ai/marketing";

export const dailySeoReportJob = task({
	id: "marketing.daily-seo-report",
	retry: {
		maxAttempts: 2,
	},
	run: async (payload: { organizationId: string; urls?: string[] }, { ctx }) => {
		const { organizationId, urls } = payload;

		try {
			// 1. Obtener URLs a analizar
			// Si no se proporcionan URLs, obtener las últimas analizadas o usar URLs por defecto
			let urlsToAnalyze: string[] = urls || [];

			if (urlsToAnalyze.length === 0) {
				// Obtener las últimas URLs analizadas
				const recentSeo = await listMarketingSeo({
					organizationId,
					limit: 10,
					offset: 0,
				});

				urlsToAnalyze = recentSeo.map((seo) => seo.url);

				// Si no hay URLs previas, usar URLs por defecto (deberían venir de configuración)
				if (urlsToAnalyze.length === 0) {
					urlsToAnalyze = [
						`https://example.com`, // URL de ejemplo - debería venir de configuración
					];
				}
			}

			// 2. Analizar cada URL
			const analysisResults = [];

			for (const url of urlsToAnalyze) {
				try {
					// Verificar si ya existe un análisis reciente (últimas 24 horas)
					const existingSeo = await listMarketingSeo({
						organizationId,
						url,
						limit: 1,
						offset: 0,
					});

					let seoRecord = existingSeo[0];

					// Crear o actualizar registro de SEO
					if (!seoRecord) {
						seoRecord = await createMarketingSeo({
							organizationId,
							url,
							status: "ANALYZING",
						});
					} else {
						// Actualizar estado a analizando
						await updateMarketingSeo(seoRecord.id, {
							status: "ANALYZING",
						});
					}

					// Realizar análisis SEO
					// Nota: En producción, necesitarías un scraper para obtener el contenido real
					const analysis = await analyzeSeo({
						url,
						// content, title, metaDescription vendrían de un scraper
					});

					// Actualizar registro con resultados
					const updated = await updateMarketingSeo(seoRecord.id, {
						status: "COMPLETED",
						score: analysis.score,
						analysis: analysis.analysis,
						recommendations: analysis.recommendations,
						optimizedContent: analysis.optimizedContent,
					});

					analysisResults.push({
						url,
						score: analysis.score,
						recommendations: analysis.recommendations.length,
					});

					await createMarketingLog({
						organizationId,
						level: "SUCCESS",
						category: "seo",
						message: `Análisis SEO completado para ${url} - Score: ${analysis.score}`,
						metadata: {
							seoId: updated.id,
							url,
							score: analysis.score,
						},
					});
				} catch (error) {
					await createMarketingLog({
						organizationId,
						level: "ERROR",
						category: "seo",
						message: `Error analizando SEO de ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				}
			}

			// 3. Generar resumen del reporte
			const avgScore =
				analysisResults.reduce((sum, r) => sum + r.score, 0) /
				analysisResults.length;

			const totalRecommendations = analysisResults.reduce(
				(sum, r) => sum + r.recommendations,
				0,
			);

			await createMarketingLog({
				organizationId,
				level: "INFO",
				category: "seo",
				message: `Reporte SEO diario completado: ${analysisResults.length} URLs analizadas, Score promedio: ${avgScore.toFixed(1)}, ${totalRecommendations} recomendaciones generadas`,
				metadata: {
					urlsAnalyzed: analysisResults.length,
					averageScore: avgScore,
					totalRecommendations,
				},
			});

			return {
				success: true,
				urlsAnalyzed: analysisResults.length,
				averageScore: avgScore,
				totalRecommendations,
				results: analysisResults,
			};
		} catch (error) {
			await createMarketingLog({
				organizationId,
				level: "ERROR",
				category: "seo",
				message: `Error en reporte SEO diario: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw error;
		}
	},
});

