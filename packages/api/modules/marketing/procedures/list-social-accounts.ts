/**
 * MarketingOS - Modo Dios
 * Procedimiento para listar cuentas de redes sociales conectadas
 */

import { ORPCError } from "@orpc/client";
import { listSocialMediaAccounts } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listSocialAccounts = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/social/accounts",
		tags: ["Marketing"],
		summary: "List social media accounts",
		description: "List all connected social media accounts for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			platform: z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE"]).optional(),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, platform, isActive } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const accounts = await listSocialMediaAccounts({
			organizationId,
			platform,
			isActive,
		});

		return { accounts };
	});

