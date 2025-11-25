/**
 * MarketingOS - Modo Dios
 * Procedimiento para listar publicaciones programadas
 */

import { ORPCError } from "@orpc/client";
import { listMarketingPublications } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listScheduledPosts = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/social/scheduled",
		tags: ["Marketing"],
		summary: "List scheduled posts",
		description: "List all scheduled social media posts",
	})
	.input(
		z.object({
			organizationId: z.string(),
			platform: z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE"]).optional(),
			status: z.enum(["SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"]).optional(),
			limit: z.number().min(1).max(100).optional().default(50),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, platform, status, limit, offset } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const publications = await listMarketingPublications({
			organizationId,
			platform,
			status,
			limit,
			offset,
		});

		return { publications };
	});

