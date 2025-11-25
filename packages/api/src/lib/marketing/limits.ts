/**
 * MarketingOS - Modo Dios
 * Sistema de límites y verificación de uso
 * 
 * Gestiona los límites según el plan:
 * - GOD_MODE: Sin límites (solo nuestro workspace)
 * - CLIENT_PREMIUM: 40 contenidos, 20 SEO, 10 ADS, publicación cada 12h
 * - TRIAL: Límites reducidos
 */

import { getMarketingConfig, getMarketingUsage, createMarketingUsage, updateMarketingUsage } from "@repo/database";

export type MarketingPlanType = "GOD_MODE" | "CLIENT_PREMIUM" | "TRIAL";

export interface UsageLimits {
	contentPerMonth: number | null; // null = ilimitado
	seoPerMonth: number | null;
	adCampaignsPerMonth: number | null;
	publicationFrequency: string; // "6h", "12h", "30m", etc.
}

export interface UsageStatus {
	used: {
		content: number;
		seo: number;
		adCampaigns: number;
	};
	limits: UsageLimits;
	canUse: {
		content: boolean;
		seo: boolean;
		adCampaigns: boolean;
	};
	remaining: {
		content: number | null;
		seo: number | null;
		adCampaigns: number | null;
	};
}

/**
 * Obtiene los límites según el tipo de plan
 */
export function getPlanLimits(planType: MarketingPlanType): UsageLimits {
	switch (planType) {
		case "GOD_MODE":
			return {
				contentPerMonth: null, // Ilimitado
				seoPerMonth: null, // Ilimitado
				adCampaignsPerMonth: null, // Ilimitado
				publicationFrequency: "30m", // Cada 30 minutos
			};

		case "CLIENT_PREMIUM":
			return {
				contentPerMonth: 40,
				seoPerMonth: 20,
				adCampaignsPerMonth: 10,
				publicationFrequency: "12h", // Cada 12 horas
			};

		case "TRIAL":
			return {
				contentPerMonth: 5,
				seoPerMonth: 3,
				adCampaignsPerMonth: 1,
				publicationFrequency: "24h", // Una vez al día
			};

		default:
			return {
				contentPerMonth: 0,
				seoPerMonth: 0,
				adCampaignsPerMonth: 0,
				publicationFrequency: "24h",
			};
	}
}

/**
 * Verifica el uso actual y límites de una organización
 */
export async function getUsageStatus(
	organizationId: string,
): Promise<UsageStatus> {
	const config = await getMarketingConfig(organizationId);
	const planType = config?.planType || "TRIAL";
	const limits = getPlanLimits(planType);

	// Obtener uso del mes actual
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	let usage = await getMarketingUsage(organizationId, month, year);

	if (!usage) {
		// Crear registro de uso para este mes
		usage = await createMarketingUsage({
			organizationId,
			month,
			year,
			contentGenerated: 0,
			seoAnalyses: 0,
			adCampaigns: 0,
			publications: 0,
		});
	}

	const used = {
		content: usage.contentGenerated,
		seo: usage.seoAnalyses,
		adCampaigns: usage.adCampaigns,
	};

	const canUse = {
		content: limits.contentPerMonth === null || used.content < limits.contentPerMonth,
		seo: limits.seoPerMonth === null || used.seo < limits.seoPerMonth,
		adCampaigns: limits.adCampaignsPerMonth === null || used.adCampaigns < limits.adCampaignsPerMonth,
	};

	const remaining = {
		content: limits.contentPerMonth === null ? null : Math.max(0, limits.contentPerMonth - used.content),
		seo: limits.seoPerMonth === null ? null : Math.max(0, limits.seoPerMonth - used.seo),
		adCampaigns: limits.adCampaignsPerMonth === null ? null : Math.max(0, limits.adCampaignsPerMonth - used.adCampaigns),
	};

	return {
		used,
		limits,
		canUse,
		remaining,
	};
}

/**
 * Verifica si se puede usar una funcionalidad específica
 */
export async function canUseFeature(
	organizationId: string,
	feature: "content" | "seo" | "adCampaigns",
): Promise<{ allowed: boolean; reason?: string; remaining?: number | null }> {
	const status = await getUsageStatus(organizationId);

	const featureMap = {
		content: {
			canUse: status.canUse.content,
			remaining: status.remaining.content,
			limit: status.limits.contentPerMonth,
		},
		seo: {
			canUse: status.canUse.seo,
			remaining: status.remaining.seo,
			limit: status.limits.seoPerMonth,
		},
		adCampaigns: {
			canUse: status.canUse.adCampaigns,
			remaining: status.remaining.adCampaigns,
			limit: status.limits.adCampaignsPerMonth,
		},
	};

	const featureStatus = featureMap[feature];

	if (!featureStatus.canUse) {
		return {
			allowed: false,
			reason: `Has alcanzado el límite de ${feature === "content" ? "contenidos" : feature === "seo" ? "análisis SEO" : "campañas ADS"} para este mes (${featureStatus.limit}). Considera actualizar tu plan.`,
			remaining: 0,
		};
	}

	return {
		allowed: true,
		remaining: featureStatus.remaining,
	};
}

/**
 * Incrementa el contador de uso para una funcionalidad
 */
export async function incrementUsage(
	organizationId: string,
	feature: "content" | "seo" | "adCampaigns" | "publications",
): Promise<void> {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	let usage = await getMarketingUsage(organizationId, month, year);

	if (!usage) {
		usage = await createMarketingUsage({
			organizationId,
			month,
			year,
			contentGenerated: 0,
			seoAnalyses: 0,
			adCampaigns: 0,
			publications: 0,
		});
	}

	const updateData: any = {};
	if (feature === "content") {
		updateData.contentGenerated = usage.contentGenerated + 1;
	} else if (feature === "seo") {
		updateData.seoAnalyses = usage.seoAnalyses + 1;
	} else if (feature === "adCampaigns") {
		updateData.adCampaigns = usage.adCampaigns + 1;
	} else if (feature === "publications") {
		updateData.publications = usage.publications + 1;
	}

	await updateMarketingUsage(usage.id, updateData);
}

/**
 * Verifica si una organización tiene Modo Dios Supremo
 */
export async function isGodMode(organizationId: string): Promise<boolean> {
	const config = await getMarketingConfig(organizationId);
	return config?.planType === "GOD_MODE";
}

/**
 * Obtiene el modelo de IA recomendado según el plan
 */
export function getRecommendedAIModel(planType: MarketingPlanType): string {
	switch (planType) {
		case "GOD_MODE":
			return "gpt-4o"; // o "claude-3-5-sonnet"
		case "CLIENT_PREMIUM":
			return "gpt-4o-mini";
		case "TRIAL":
			return "gpt-4o-mini";
		default:
			return "gpt-4o-mini";
	}
}

