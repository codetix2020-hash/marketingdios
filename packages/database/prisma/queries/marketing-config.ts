/**
 * MarketingOS - Modo Dios
 * Queries para configuración y uso de MarketingOS
 */

import { db } from "../client";

// ==================== Marketing Config ====================

export async function getMarketingConfig(organizationId: string) {
	return await db.marketingConfig.findUnique({
		where: { organizationId },
	});
}

export async function createMarketingConfig(data: {
	organizationId: string;
	planType?: "GOD_MODE" | "CLIENT_PREMIUM" | "TRIAL";
	autoPilotEnabled?: boolean;
	autoPilotFrequency?: string;
	aiModel?: string;
	optimizationFrequency?: string;
	reportFrequency?: string;
}) {
	return await db.marketingConfig.create({
		data,
	});
}

export async function updateMarketingConfig(
	organizationId: string,
	data: {
		planType?: "GOD_MODE" | "CLIENT_PREMIUM" | "TRIAL";
		autoPilotEnabled?: boolean;
		autoPilotFrequency?: string;
		aiModel?: string;
		optimizationFrequency?: string;
		reportFrequency?: string;
	},
) {
	return await db.marketingConfig.upsert({
		where: { organizationId },
		update: data,
		create: {
			organizationId,
			...data,
		},
	});
}

// ==================== Marketing Usage ====================

export async function getMarketingUsage(
	organizationId: string,
	month: number,
	year: number,
) {
	return await db.marketingUsage.findUnique({
		where: {
			organizationId_month_year: {
				organizationId,
				month,
				year,
			},
		},
	});
}

export async function createMarketingUsage(data: {
	organizationId: string;
	month: number;
	year: number;
	contentGenerated?: number;
	seoAnalyses?: number;
	adCampaigns?: number;
	publications?: number;
}) {
	return await db.marketingUsage.create({
		data,
	});
}

export async function updateMarketingUsage(
	id: string,
	data: {
		contentGenerated?: number;
		seoAnalyses?: number;
		adCampaigns?: number;
		publications?: number;
	},
) {
	return await db.marketingUsage.update({
		where: { id },
		data,
	});
}

// ==================== Marketing Onboarding ====================

export async function getMarketingOnboarding(organizationId: string) {
	return await db.marketingOnboarding.findUnique({
		where: { organizationId },
	});
}

export async function createMarketingOnboarding(data: {
	organizationId: string;
	currentStep?: "BUSINESS_INFO" | "SOCIAL_MEDIA" | "OBJECTIVES" | "TONE_STYLE" | "AUTOPILOT" | "COMPLETED";
	completed?: boolean;
	businessInfo?: any;
	socialMedia?: any;
	objectives?: any;
	toneStyle?: any;
}) {
	return await db.marketingOnboarding.create({
		data,
	});
}

export async function updateMarketingOnboarding(
	organizationId: string,
	data: {
		currentStep?: "BUSINESS_INFO" | "SOCIAL_MEDIA" | "OBJECTIVES" | "TONE_STYLE" | "AUTOPILOT" | "COMPLETED";
		completed?: boolean;
		businessInfo?: any;
		socialMedia?: any;
		objectives?: any;
		toneStyle?: any;
	},
) {
	return await db.marketingOnboarding.upsert({
		where: { organizationId },
		update: data,
		create: {
			organizationId,
			...data,
		},
	});
}

