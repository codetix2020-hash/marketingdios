/**
 * MarketingOS - Modo Dios
 * Job de Trigger.dev: Reporte ejecutivo semanal
 * 
 * Este job se ejecuta semanalmente y:
 * - Genera un informe tipo "CEO summary" con KPIs clave
 * - Incluye análisis de tendencias y recomendaciones estratégicas
 * - Guarda el informe en MarketingContent como tipo BLOG
 * 
 * Configuración:
 * - Frecuencia: Semanal (cada lunes a las 9 AM)
 * - Trigger: Recurrente (cron: "0 9 * * 1")
 */

/**
 * NOTA: Ver packages/api/src/jobs/marketing/autopublish.ts para instrucciones de configuración
 */
import { task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMarketingContent, createMarketingLog, getMarketingKpis, listMarketingContent, listMarketingAdCampaigns } from "@repo/database";

export const weeklyExecReportJob = task({
	id: "marketing.weekly-exec-report",
	retry: {
		maxAttempts: 2,
	},
	run: async (payload: { organizationId: string }, { ctx }) => {
		const { organizationId } = payload;

		try {
			// 1. Recopilar datos de la semana pasada
			const endDate = new Date();
			const startDate = new Date(endDate);
			startDate.setDate(startDate.getDate() - 7); // Últimos 7 días

			const [kpis, content, campaigns] = await Promise.all([
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
			]);

			// 2. Calcular métricas clave
			const metrics = {
				totalContent: content.length,
				publishedContent: content.filter((c) => c.status === "PUBLISHED").length,
				activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
				totalCampaigns: campaigns.length,
				contentByType: {
					EMAIL: content.filter((c) => c.type === "EMAIL").length,
					POST: content.filter((c) => c.type === "POST").length,
					REEL: content.filter((c) => c.type === "REEL").length,
					BLOG: content.filter((c) => c.type === "BLOG").length,
				},
				// Calcular KPIs agregados
				totalImpressions: 0, // Vendría de MarketingAdPerformance
				totalClicks: 0,
				totalConversions: 0,
				totalSpend: 0,
				averageCTR: 0,
			};

			// 3. Generar informe ejecutivo usando IA
			const reportPrompt = `Eres un consultor de marketing estratégico. Genera un informe ejecutivo semanal (CEO summary) basado en los siguientes datos:

PERÍODO: ${startDate.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString("es-ES")}

MÉTRICAS:
- Contenido total generado: ${metrics.totalContent}
- Contenido publicado: ${metrics.publishedContent}
- Campañas activas: ${metrics.activeCampaigns}
- Total de campañas: ${metrics.totalCampaigns}

CONTENIDO POR TIPO:
- Emails: ${metrics.contentByType.EMAIL}
- Posts: ${metrics.contentByType.POST}
- Reels: ${metrics.contentByType.REEL}
- Blogs: ${metrics.contentByType.BLOG}

KPIs ADICIONALES:
${kpis.length > 0 ? kpis.map((kpi) => `- ${kpi.metric}: ${kpi.value}`).join("\n") : "- No hay KPIs adicionales registrados"}

Genera un informe ejecutivo que incluya:
1. Resumen ejecutivo (2-3 párrafos)
2. Métricas clave destacadas
3. Análisis de tendencias
4. Recomendaciones estratégicas para la próxima semana
5. Acciones prioritarias

El informe debe ser:
- Conciso pero completo
- Orientado a decisiones ejecutivas
- Con lenguaje profesional pero accesible
- Con datos específicos y acciones claras

Formato: Markdown con títulos y secciones bien estructuradas.`;

			const { text: reportContent } = await generateText({
				model: openai("gpt-4o-mini"),
				prompt: reportPrompt,
				maxTokens: 2000,
			});

			// 4. Guardar informe como contenido tipo BLOG
			const reportTitle = `Reporte Ejecutivo Semanal - ${endDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`;

			const savedReport = await createMarketingContent({
				organizationId,
				userId: "system",
				type: "BLOG",
				status: "GENERATED",
				title: reportTitle,
				content: reportContent,
				metadata: {
					reportType: "weekly-executive",
					period: {
						start: startDate.toISOString(),
						end: endDate.toISOString(),
					},
					metrics,
					generatedAt: new Date().toISOString(),
				},
				aiPrompt: "Generate weekly executive report",
				aiModel: "gpt-4o-mini",
			});

			// 5. Log de éxito
			await createMarketingLog({
				organizationId,
				level: "SUCCESS",
				category: "automation",
				message: `Reporte ejecutivo semanal generado: ${reportTitle}`,
				metadata: {
					contentId: savedReport.id,
					metrics,
				},
			});

			return {
				success: true,
				reportId: savedReport.id,
				reportTitle,
				metrics,
			};
		} catch (error) {
			await createMarketingLog({
				organizationId,
				level: "ERROR",
				category: "automation",
				message: `Error generando reporte ejecutivo semanal: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw error;
		}
	},
});

