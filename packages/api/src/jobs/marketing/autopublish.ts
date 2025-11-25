/**
 * MarketingOS - Modo Dios
 * Job de Trigger.dev: Auto-publicación de contenido
 * 
 * Este job se ejecuta cada 6 horas y:
 * - Genera contenido según las preferencias del workspace
 * - Lo publica automáticamente si AutoPilot está activo
 * 
 * Configuración:
 * - Frecuencia: Cada 6 horas
 * - Trigger: Recurrente
 */

/**
 * NOTA: Trigger.dev requiere configuración adicional
 * 
 * Para activar estos jobs:
 * 1. Instalar @trigger.dev/sdk: pnpm add @trigger.dev/sdk
 * 2. Configurar trigger.config.ts en la raíz del proyecto
 * 3. Registrar los jobs en el trigger client
 * 4. Configurar variables de entorno (TRIGGER_SECRET_KEY, etc.)
 * 
 * Documentación: https://trigger.dev/docs
 */
import { task } from "@trigger.dev/sdk/v3";
import { listMarketingContent, createMarketingContent, createMarketingPublication, createMarketingLog, listSocialMediaAccounts } from "@repo/database";
import { generateMarketingContent } from "../../lib/ai/marketing";
import { publishToPlatform } from "../../lib/social";

export const autopublishJob = task({
	id: "marketing.autopublish",
	retry: {
		maxAttempts: 3,
	},
	run: async (payload: { organizationId: string }, { ctx }) => {
		const { organizationId } = payload;

		try {
			// 1. Verificar si AutoPilot está activo para esta organización
			// Por ahora, asumimos que está activo si hay cuentas de redes sociales conectadas
			const socialAccounts = await listSocialMediaAccounts({
				organizationId,
				isActive: true,
			});

			if (socialAccounts.length === 0) {
				await createMarketingLog({
					organizationId,
					level: "INFO",
					category: "automation",
					message: "AutoPilot desactivado: No hay cuentas de redes sociales conectadas",
				});
				return { success: false, reason: "No social accounts connected" };
			}

			// 2. Obtener preferencias del workspace (por ahora, valores por defecto)
			// En el futuro, esto vendría de una tabla de configuración
			const preferences = {
				contentTypes: ["POST", "REEL"] as const,
				tone: "professional",
				targetAudience: "General audience",
				length: "medium" as const,
				autoPublish: true,
			};

			// 3. Generar contenido para cada tipo preferido
			const generatedContent = [];

			for (const contentType of preferences.contentTypes) {
				try {
					// Generar tema basado en el tipo de contenido
					const topic = generateTopicForContentType(contentType);

					// Generar contenido usando IA
					const content = await generateMarketingContent({
						type: contentType,
						topic,
						tone: preferences.tone,
						targetAudience: preferences.targetAudience,
						length: preferences.length,
					});

					// Guardar en base de datos
					const savedContent = await createMarketingContent({
						organizationId,
						userId: "system", // Sistema automático
						type: contentType,
						status: preferences.autoPublish ? "GENERATED" : "DRAFT",
						title: content.title,
						content: content.content,
						metadata: content.metadata,
						aiPrompt: `Auto-generate ${contentType} about ${topic}`,
						aiModel: "gpt-4o-mini",
					});

					generatedContent.push(savedContent);

					// 4. Publicar automáticamente si AutoPilot está activo
					if (preferences.autoPublish && savedContent) {
						// Publicar en todas las plataformas activas compatibles
						const compatiblePlatforms = getCompatiblePlatforms(contentType, socialAccounts);

						for (const account of compatiblePlatforms) {
							try {
								// Crear registro de publicación
								const publication = await createMarketingPublication({
									organizationId,
									contentId: savedContent.id,
									platform: account.platform,
									status: "SCHEDULED",
									scheduledAt: new Date(), // Publicar inmediatamente
								});

								// Publicar en la plataforma
								const publishResult = await publishToPlatform({
									platform: account.platform,
									content: savedContent.content,
									title: savedContent.title || undefined,
									accessToken: account.accessToken,
									accountId: account.accountId,
								});

								// Actualizar publicación con resultado
								await createMarketingPublication({
									organizationId,
									contentId: savedContent.id,
									platform: account.platform,
									status: publishResult.success ? "PUBLISHED" : "FAILED",
									publishedAt: publishResult.success ? new Date() : undefined,
									externalId: publishResult.externalId,
									url: publishResult.url,
									error: publishResult.error,
								});

								await createMarketingLog({
									organizationId,
									level: publishResult.success ? "SUCCESS" : "ERROR",
									category: "publication",
									message: `Content published to ${account.platform}: ${publishResult.success ? "Success" : publishResult.error}`,
									metadata: {
										publicationId: publication.id,
										contentId: savedContent.id,
										platform: account.platform,
									},
								});
							} catch (error) {
								await createMarketingLog({
									organizationId,
									level: "ERROR",
									category: "publication",
									message: `Error publishing to ${account.platform}: ${error instanceof Error ? error.message : "Unknown error"}`,
								});
							}
						}
					}
				} catch (error) {
					await createMarketingLog({
						organizationId,
						level: "ERROR",
						category: "automation",
						message: `Error generating ${contentType}: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				}
			}

			await createMarketingLog({
				organizationId,
				level: "SUCCESS",
				category: "automation",
				message: `AutoPilot ejecutado: ${generatedContent.length} contenidos generados y publicados`,
				metadata: {
					contentCount: generatedContent.length,
					contentTypes: preferences.contentTypes,
				},
			});

			return {
				success: true,
				generatedContent: generatedContent.length,
				contentIds: generatedContent.map((c) => c.id),
			};
		} catch (error) {
			await createMarketingLog({
				organizationId,
				level: "ERROR",
				category: "automation",
				message: `Error en AutoPilot: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw error;
		}
	},
});

/**
 * Genera un tema apropiado según el tipo de contenido
 */
function generateTopicForContentType(
	type: "EMAIL" | "POST" | "REEL" | "BLOG",
): string {
	const topics = {
		EMAIL: "Actualización semanal de productos y servicios",
		POST: "Consejos de marketing digital y crecimiento empresarial",
		REEL: "Tips rápidos de marketing para emprendedores",
		BLOG: "Estrategias avanzadas de marketing digital",
	};

	return topics[type] || "Marketing digital";
}

/**
 * Obtiene las plataformas compatibles con el tipo de contenido
 */
function getCompatiblePlatforms(
	contentType: "EMAIL" | "POST" | "REEL" | "BLOG",
	accounts: Array<{ platform: string }>,
): Array<{ platform: string; accessToken: string; accountId: string }> {
	// Mapeo de tipos de contenido a plataformas compatibles
	const compatibility: Record<string, string[]> = {
		POST: ["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN"],
		REEL: ["INSTAGRAM", "TIKTOK", "YOUTUBE"],
		BLOG: ["FACEBOOK", "LINKEDIN", "TWITTER"],
		EMAIL: [], // Los emails no se publican en redes sociales
	};

	const compatiblePlatformNames = compatibility[contentType] || [];
	
	return accounts.filter((account) =>
		compatiblePlatformNames.includes(account.platform),
	) as Array<{ platform: string; accessToken: string; accountId: string }>;
}

