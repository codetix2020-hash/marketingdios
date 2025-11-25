/**
 * MarketingOS - Modo Dios
 * Procedimiento para programar una publicación en redes sociales
 */

import { ORPCError } from "@orpc/client";
import { createMarketingPublication, createMarketingLog } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const schedulePost = protectedProcedure
	.route({
		method: "POST",
		path: "/marketing/social/schedule",
		tags: ["Marketing"],
		summary: "Schedule social media post",
		description: "Schedule a post to be published on social media platforms",
	})
	.input(
		z.object({
			organizationId: z.string(),
			contentId: z.string().optional(),
			platform: z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE"]),
			scheduledAt: z.string().datetime(),
			metadata: z.record(z.string(), z.any()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, contentId, platform, scheduledAt, metadata } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const publication = await createMarketingPublication({
			organizationId,
			contentId,
			platform,
			status: "SCHEDULED",
			scheduledAt: new Date(scheduledAt),
			metadata: metadata as any,
		});

		await createMarketingLog({
			organizationId,
			userId: user.id,
			level: "INFO",
			category: "publication",
			message: `Publicación programada para ${platform} el ${scheduledAt}`,
		});

		return { publication };
	});

