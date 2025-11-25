/**
 * MarketingOS - Modo Dios
 * Queries de base de datos para MarketingOS
 */

import { db } from "../client";
import type { Prisma } from "../generated/client";

// ==================== Marketing Content ====================

export async function createMarketingContent(data: {
	organizationId: string;
	userId: string;
	type: "EMAIL" | "POST" | "REEL" | "BLOG";
	status?: "DRAFT" | "GENERATED" | "OPTIMIZED" | "PUBLISHED" | "ARCHIVED";
	title?: string;
	content: string;
	metadata?: Prisma.JsonValue;
	aiPrompt?: string;
	aiModel?: string;
	optimizationData?: Prisma.JsonValue;
}) {
	return await db.marketingContent.create({
		data,
	});
}

export async function getMarketingContent(id: string) {
	return await db.marketingContent.findUnique({
		where: { id },
		include: {
			organization: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			publications: true,
		},
	});
}

export async function listMarketingContent(options: {
	organizationId: string;
	userId?: string;
	type?: "EMAIL" | "POST" | "REEL" | "BLOG";
	status?: "DRAFT" | "GENERATED" | "OPTIMIZED" | "PUBLISHED" | "ARCHIVED";
	limit?: number;
	offset?: number;
}) {
	const { organizationId, userId, type, status, limit = 50, offset = 0 } = options;

	return await db.marketingContent.findMany({
		where: {
			organizationId,
			userId: userId ? { equals: userId } : undefined,
			type: type ? { equals: type } : undefined,
			status: status ? { equals: status } : undefined,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

export async function updateMarketingContent(
	id: string,
	data: {
		status?: "DRAFT" | "GENERATED" | "OPTIMIZED" | "PUBLISHED" | "ARCHIVED";
		title?: string;
		content?: string;
		metadata?: Prisma.JsonValue;
		optimizationData?: Prisma.JsonValue;
		publishedAt?: Date | null;
	},
) {
	return await db.marketingContent.update({
		where: { id },
		data,
	});
}

export async function deleteMarketingContent(id: string) {
	return await db.marketingContent.delete({
		where: { id },
	});
}

// ==================== SEO ====================

export async function createMarketingSeo(data: {
	organizationId: string;
	url: string;
	status?: "PENDING" | "ANALYZING" | "COMPLETED" | "FAILED";
	score?: number;
	analysis?: Prisma.JsonValue;
	recommendations?: Prisma.JsonValue;
	optimizedContent?: string;
}) {
	return await db.marketingSeo.create({
		data,
	});
}

export async function getMarketingSeo(id: string) {
	return await db.marketingSeo.findUnique({
		where: { id },
		include: {
			organization: true,
		},
	});
}

export async function listMarketingSeo(options: {
	organizationId: string;
	url?: string;
	status?: "PENDING" | "ANALYZING" | "COMPLETED" | "FAILED";
	limit?: number;
	offset?: number;
}) {
	const { organizationId, url, status, limit = 50, offset = 0 } = options;

	return await db.marketingSeo.findMany({
		where: {
			organizationId,
			url: url ? { contains: url } : undefined,
			status: status ? { equals: status } : undefined,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

export async function updateMarketingSeo(
	id: string,
	data: {
		status?: "PENDING" | "ANALYZING" | "COMPLETED" | "FAILED";
		score?: number;
		analysis?: Prisma.JsonValue;
		recommendations?: Prisma.JsonValue;
		optimizedContent?: string;
	},
) {
	return await db.marketingSeo.update({
		where: { id },
		data,
	});
}

// ==================== Ad Campaigns ====================

export async function createMarketingAdCampaign(data: {
	organizationId: string;
	userId: string;
	name: string;
	platform: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS" | "TWITTER_ADS";
	status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
	budget?: number;
	targetAudience?: Prisma.JsonValue;
	keywords?: Prisma.JsonValue;
	adCopy: string;
	aiGenerated?: boolean;
	externalId?: string;
}) {
	return await db.marketingAdCampaign.create({
		data,
	});
}

export async function getMarketingAdCampaign(id: string) {
	return await db.marketingAdCampaign.findUnique({
		where: { id },
		include: {
			organization: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			performance: {
				orderBy: { date: "desc" },
				take: 30, // Últimos 30 días
			},
		},
	});
}

export async function listMarketingAdCampaigns(options: {
	organizationId: string;
	userId?: string;
	platform?: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS" | "TWITTER_ADS";
	status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
	limit?: number;
	offset?: number;
}) {
	const { organizationId, userId, platform, status, limit = 50, offset = 0 } = options;

	return await db.marketingAdCampaign.findMany({
		where: {
			organizationId,
			userId: userId ? { equals: userId } : undefined,
			platform: platform ? { equals: platform } : undefined,
			status: status ? { equals: status } : undefined,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

export async function updateMarketingAdCampaign(
	id: string,
	data: {
		name?: string;
		status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
		budget?: number;
		targetAudience?: Prisma.JsonValue;
		keywords?: Prisma.JsonValue;
		adCopy?: string;
		externalId?: string;
	},
) {
	return await db.marketingAdCampaign.update({
		where: { id },
		data,
	});
}

export async function createMarketingAdPerformance(data: {
	campaignId: string;
	impressions?: number;
	clicks?: number;
	conversions?: number;
	spend?: number;
	revenue?: number;
	ctr?: number;
	cpc?: number;
	cpa?: number;
	roas?: number;
	date: Date;
	metadata?: Prisma.JsonValue;
}) {
	return await db.marketingAdPerformance.create({
		data,
	});
}

// ==================== Publications ====================

export async function createMarketingPublication(data: {
	organizationId: string;
	contentId?: string;
	platform: "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE";
	status?: "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
	scheduledAt?: Date;
	publishedAt?: Date;
	externalId?: string;
	url?: string;
	error?: string;
	metadata?: Prisma.JsonValue;
}) {
	return await db.marketingPublication.create({
		data,
	});
}

export async function getMarketingPublication(id: string) {
	return await db.marketingPublication.findUnique({
		where: { id },
		include: {
			organization: true,
			content: true,
		},
	});
}

export async function listMarketingPublications(options: {
	organizationId: string;
	contentId?: string;
	platform?: "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE";
	status?: "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
	limit?: number;
	offset?: number;
}) {
	const { organizationId, contentId, platform, status, limit = 50, offset = 0 } = options;

	return await db.marketingPublication.findMany({
		where: {
			organizationId,
			contentId: contentId ? { equals: contentId } : undefined,
			platform: platform ? { equals: platform } : undefined,
			status: status ? { equals: status } : undefined,
		},
		orderBy: { scheduledAt: "desc" },
		take: limit,
		skip: offset,
		include: {
			content: true,
		},
	});
}

export async function updateMarketingPublication(
	id: string,
	data: {
		status?: "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
		publishedAt?: Date | null;
		externalId?: string;
		url?: string;
		error?: string | null;
		metadata?: Prisma.JsonValue;
	},
) {
	return await db.marketingPublication.update({
		where: { id },
		data,
	});
}

// ==================== Social Media Accounts ====================

export async function createSocialMediaAccount(data: {
	organizationId: string;
	platform: "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE";
	accountName: string;
	accountId: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	isActive?: boolean;
	metadata?: Prisma.JsonValue;
}) {
	return await db.socialMediaAccount.create({
		data,
	});
}

export async function listSocialMediaAccounts(options: {
	organizationId: string;
	platform?: "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE";
	isActive?: boolean;
}) {
	const { organizationId, platform, isActive } = options;

	return await db.socialMediaAccount.findMany({
		where: {
			organizationId,
			platform: platform ? { equals: platform } : undefined,
			isActive: isActive !== undefined ? { equals: isActive } : undefined,
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function updateSocialMediaAccount(
	id: string,
	data: {
		accountName?: string;
		accessToken?: string;
		refreshToken?: string;
		expiresAt?: Date | null;
		isActive?: boolean;
		metadata?: Prisma.JsonValue;
	},
) {
	return await db.socialMediaAccount.update({
		where: { id },
		data,
	});
}

// ==================== KPIs ====================

export async function createMarketingKpi(data: {
	organizationId: string;
	date: Date;
	metric: string;
	value: number;
	metadata?: Prisma.JsonValue;
}) {
	return await db.marketingKpi.create({
		data,
	});
}

export async function getMarketingKpis(options: {
	organizationId: string;
	metric?: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}) {
	const { organizationId, metric, startDate, endDate, limit = 100 } = options;

	return await db.marketingKpi.findMany({
		where: {
			organizationId,
			metric: metric ? { equals: metric } : undefined,
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
		orderBy: { date: "desc" },
		take: limit,
	});
}

// ==================== Logs ====================

export async function createMarketingLog(data: {
	organizationId?: string;
	userId?: string;
	level: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
	category: string;
	message: string;
	metadata?: Prisma.JsonValue;
}) {
	return await db.marketingLog.create({
		data,
	});
}

export async function listMarketingLogs(options: {
	organizationId?: string;
	userId?: string;
	level?: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
	category?: string;
	limit?: number;
	offset?: number;
}) {
	const { organizationId, userId, level, category, limit = 100, offset = 0 } = options;

	return await db.marketingLog.findMany({
		where: {
			organizationId: organizationId ? { equals: organizationId } : undefined,
			userId: userId ? { equals: userId } : undefined,
			level: level ? { equals: level } : undefined,
			category: category ? { equals: category } : undefined,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
		include: {
			user: userId
				? {
						select: {
							id: true,
							name: true,
							email: true,
						},
					}
				: undefined,
		},
	});
}

// ==================== Learning ====================

export async function createMarketingLearning(data: {
	organizationId: string;
	eventType: string;
	eventData: Prisma.JsonValue;
	insights?: Prisma.JsonValue;
	applied?: boolean;
}) {
	return await db.marketingLearning.create({
		data,
	});
}

export async function listMarketingLearnings(options: {
	organizationId: string;
	eventType?: string;
	applied?: boolean;
	limit?: number;
	offset?: number;
}) {
	const { organizationId, eventType, applied, limit = 50, offset = 0 } = options;

	return await db.marketingLearning.findMany({
		where: {
			organizationId,
			eventType: eventType ? { equals: eventType } : undefined,
			applied: applied !== undefined ? { equals: applied } : undefined,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

export async function updateMarketingLearning(
	id: string,
	data: {
		insights?: Prisma.JsonValue;
		applied?: boolean;
	},
) {
	return await db.marketingLearning.update({
		where: { id },
		data,
	});
}

