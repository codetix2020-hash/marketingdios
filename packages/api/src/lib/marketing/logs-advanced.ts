/**
 * MarketingOS - Modo Dios
 * Sistema de logs avanzados
 * 
 * Funcionalidades:
 * - Logs por categoría
 * - Logs inteligentes con resumen diario
 * - Logs con recomendaciones
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { listMarketingLogs, createMarketingLog } from "@repo/database";
import { isGodMode } from "./limits";

export interface LogSummary {
	date: Date;
	totalLogs: number;
	byLevel: {
		INFO: number;
		SUCCESS: number;
		WARNING: number;
		ERROR: number;
	};
	byCategory: Record<string, number>;
	keyEvents: Array<{
		level: string;
		category: string;
		message: string;
		timestamp: Date;
	}>;
	recommendations: string[];
}

/**
 * Genera un resumen diario inteligente de logs
 */
export async function generateDailyLogSummary(
	organizationId: string,
	date?: Date,
): Promise<LogSummary> {
	const targetDate = date || new Date();
	const startOfDay = new Date(targetDate);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(targetDate);
	endOfDay.setHours(23, 59, 59, 999);

	const logs = await listMarketingLogs({
		organizationId,
		limit: 1000,
		offset: 0,
	});

	// Filtrar logs del día
	const dayLogs = logs.filter(
		(log) =>
			new Date(log.createdAt) >= startOfDay && new Date(log.createdAt) <= endOfDay,
	);

	// Agrupar por nivel
	const byLevel = {
		INFO: dayLogs.filter((l) => l.level === "INFO").length,
		SUCCESS: dayLogs.filter((l) => l.level === "SUCCESS").length,
		WARNING: dayLogs.filter((l) => l.level === "WARNING").length,
		ERROR: dayLogs.filter((l) => l.level === "ERROR").length,
	};

	// Agrupar por categoría
	const byCategory: Record<string, number> = {};
	dayLogs.forEach((log) => {
		byCategory[log.category] = (byCategory[log.category] || 0) + 1;
	});

	// Identificar eventos clave (errores y warnings)
	const keyEvents = dayLogs
		.filter((log) => log.level === "ERROR" || log.level === "WARNING")
		.slice(0, 10)
		.map((log) => ({
			level: log.level,
			category: log.category,
			message: log.message,
			timestamp: new Date(log.createdAt),
		}));

	// Generar recomendaciones usando IA
	const isGodModeOrg = await isGodMode(organizationId);
	const recommendations = await generateLogRecommendations(
		dayLogs,
		isGodModeOrg,
	);

	return {
		date: targetDate,
		totalLogs: dayLogs.length,
		byLevel,
		byCategory,
		keyEvents,
		recommendations,
	};
}

/**
 * Genera recomendaciones basadas en los logs
 */
async function generateLogRecommendations(
	logs: any[],
	useAdvancedAI: boolean = false,
): Promise<string[]> {
	if (logs.length === 0) {
		return ["No hay actividad registrada hoy"];
	}

	const errorCount = logs.filter((l) => l.level === "ERROR").length;
	const warningCount = logs.filter((l) => l.level === "WARNING").length;
	const successCount = logs.filter((l) => l.level === "SUCCESS").length;

	const prompt = `Analiza estos logs de marketing y genera recomendaciones accionables.

RESUMEN:
- Total de logs: ${logs.length}
- Errores: ${errorCount}
- Advertencias: ${warningCount}
- Éxitos: ${successCount}

LOGS RECIENTES (últimos 10):
${logs.slice(0, 10).map((l) => `[${l.level}] ${l.category}: ${l.message}`).join("\n")}

Genera 3-5 recomendaciones específicas y accionables basadas en estos logs.
Formato: Lista simple, una recomendación por línea.`;

	try {
		const { text } = await generateText({
			model: useAdvancedAI ? openai("gpt-4o") : openai("gpt-4o-mini"),
			prompt,
			maxTokens: 500,
		});

		// Parsear recomendaciones (una por línea)
		return text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.match(/^\d+\./))
			.slice(0, 5);
	} catch {
		// Fallback a recomendaciones básicas
		const recommendations: string[] = [];

		if (errorCount > 0) {
			recommendations.push(
				`Revisar ${errorCount} error(es) detectado(s) y tomar acciones correctivas`,
			);
		}

		if (warningCount > 5) {
			recommendations.push(
				`Hay ${warningCount} advertencias. Considera revisar la configuración del sistema`,
			);
		}

		if (successCount > 0 && errorCount === 0) {
			recommendations.push("Sistema funcionando correctamente. Continúa monitoreando.");
		}

		return recommendations.length > 0 ? recommendations : ["No hay recomendaciones específicas"];
	}
}

/**
 * Obtiene logs agrupados por categoría
 */
export async function getLogsByCategory(
	organizationId: string,
	category?: string,
	limit: number = 100,
) {
	return await listMarketingLogs({
		organizationId,
		category,
		limit,
		offset: 0,
	});
}

/**
 * Crea un log inteligente con contexto adicional
 */
export async function createIntelligentLog(options: {
	organizationId: string;
	userId?: string;
	level: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
	category: string;
	message: string;
	context?: Record<string, any>;
}): Promise<void> {
	const { organizationId, userId, level, category, message, context } = options;

	// Enriquecer el mensaje con contexto si es un error
	let enrichedMessage = message;
	if (level === "ERROR" && context) {
		enrichedMessage = `${message} | Contexto: ${JSON.stringify(context)}`;
	}

	await createMarketingLog({
		organizationId,
		userId,
		level,
		category,
		message: enrichedMessage,
		metadata: context,
	});

	// Si es un error crítico, generar recomendación automática
	if (level === "ERROR" && category === "automation") {
		await createMarketingLog({
			organizationId,
			level: "INFO",
			category: "recommendations",
			message: `Recomendación automática: Revisar la configuración de automatización debido a un error detectado`,
			metadata: {
				relatedError: message,
				suggestion: "Verificar configuración de AutoPilot y jobs programados",
			},
		});
	}
}

