/**
 * MarketingOS - Modo Dios
 * Procedimiento para listar logs del sistema
 */

import { ORPCError } from "@orpc/client";
import { listMarketingLogs } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listLogs = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/logs",
		tags: ["Marketing"],
		summary: "List marketing logs",
		description: "List marketing system logs",
	})
	.input(
		z.object({
			organizationId: z.string(),
			level: z.enum(["INFO", "WARNING", "ERROR", "SUCCESS"]).optional(),
			category: z.string().optional(),
			limit: z.number().min(1).max(200).optional().default(100),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, level, category, limit, offset } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const logs = await listMarketingLogs({
			organizationId,
			level,
			category,
			limit,
			offset,
		});

		return { logs };
	});

