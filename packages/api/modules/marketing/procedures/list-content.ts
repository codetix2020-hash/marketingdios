/**
 * MarketingOS - Modo Dios
 * Procedimiento para listar contenido de marketing
 */

import { ORPCError } from "@orpc/client";
import { listMarketingContent } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listContent = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/content",
		tags: ["Marketing"],
		summary: "List marketing content",
		description: "List all marketing content for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			userId: z.string().optional(),
			type: z.enum(["EMAIL", "POST", "REEL", "BLOG"]).optional(),
			status: z.enum(["DRAFT", "GENERATED", "OPTIMIZED", "PUBLISHED", "ARCHIVED"]).optional(),
			limit: z.number().min(1).max(100).optional().default(50),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, userId, type, status, limit, offset } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		// Solo permitir ver contenido propio o si es admin
		const canViewAll = membership.role === "admin" || membership.role === "owner";
		const filteredUserId = canViewAll ? userId : user.id;

		const content = await listMarketingContent({
			organizationId,
			userId: filteredUserId,
			type,
			status,
			limit,
			offset,
		});

		return { content };
	});

