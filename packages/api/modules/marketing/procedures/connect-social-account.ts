/**
 * MarketingOS - Modo Dios
 * Procedimiento para conectar una cuenta de red social
 */

import { ORPCError } from "@orpc/client";
import { createSocialMediaAccount, createMarketingLog } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const connectSocialAccount = protectedProcedure
	.route({
		method: "POST",
		path: "/marketing/social/accounts/connect",
		tags: ["Marketing"],
		summary: "Connect social media account",
		description: "Connect a social media account to the organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			platform: z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE"]),
			accountName: z.string(),
			accountId: z.string(),
			accessToken: z.string(),
			refreshToken: z.string().optional(),
			expiresAt: z.string().datetime().optional(),
			metadata: z.record(z.string(), z.any()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, platform, accountName, accountId, accessToken, refreshToken, expiresAt, metadata } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const account = await createSocialMediaAccount({
			organizationId,
			platform,
			accountName,
			accountId,
			accessToken,
			refreshToken,
			expiresAt: expiresAt ? new Date(expiresAt) : undefined,
			isActive: true,
			metadata: metadata as any,
		});

		await createMarketingLog({
			organizationId,
			userId: user.id,
			level: "SUCCESS",
			category: "social",
			message: `Cuenta de ${platform} conectada: ${accountName}`,
		});

		return { account };
	});

