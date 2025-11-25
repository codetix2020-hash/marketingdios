/**
 * MarketingOS - Modo Dios
 * Procedimiento para listar campañas publicitarias
 */

import { ORPCError } from "@orpc/client";
import { listMarketingAdCampaigns } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listCampaigns = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/ads/campaigns",
		tags: ["Marketing"],
		summary: "List ad campaigns",
		description: "List all ad campaigns for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			userId: z.string().optional(),
			platform: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "INSTAGRAM_ADS", "LINKEDIN_ADS", "TWITTER_ADS"]).optional(),
			status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
			limit: z.number().min(1).max(100).optional().default(50),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, userId, platform, status, limit, offset } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const campaigns = await listMarketingAdCampaigns({
			organizationId,
			userId,
			platform,
			status,
			limit,
			offset,
		});

		return { campaigns };
	});

