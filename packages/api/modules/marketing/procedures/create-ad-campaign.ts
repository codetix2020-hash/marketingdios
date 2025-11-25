/**
 * MarketingOS - Modo Dios
 * Procedimiento para crear una campaña de anuncios
 */

import { ORPCError } from "@orpc/client";
import { createMarketingAdCampaign, createMarketingLog } from "@repo/database";
import { generateAdCampaign } from "../../../src/lib/ai/marketing";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const createAdCampaign = protectedProcedure
	.route({
		method: "POST",
		path: "/marketing/ads/campaigns",
		tags: ["Marketing"],
		summary: "Create ad campaign",
		description: "Create a new ad campaign using AI",
	})
	.input(
		z.object({
			organizationId: z.string(),
			platform: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "INSTAGRAM_ADS", "LINKEDIN_ADS", "TWITTER_ADS"]),
			product: z.string().optional(),
			service: z.string().optional(),
			targetAudience: z.string().optional(),
			goal: z.enum(["AWARENESS", "CONVERSIONS", "LEADS", "SALES", "ENGAGEMENT"]),
			budget: z.number().optional(),
			keywords: z.array(z.string()).optional(),
			tone: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, platform, product, service, targetAudience, goal, budget, keywords, tone } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		// Verificar límites
		const { canUseFeature, incrementUsage } = await import("../../../src/lib/marketing");
		const limitCheck = await canUseFeature(organizationId, "adCampaigns");
		if (!limitCheck.allowed) {
			throw new ORPCError("FORBIDDEN", { message: limitCheck.reason ?? "Limit exceeded" });
		}

		try {
			// Generar campaña usando IA
			const generated = await generateAdCampaign({
				platform,
				product,
				service,
				targetAudience,
				goal,
				budget,
				keywords: keywords || [],
				tone,
			});

			// Guardar en base de datos
			const campaign = await createMarketingAdCampaign({
				organizationId,
				userId: user.id,
				name: generated.name,
				platform,
				status: "DRAFT",
				budget,
				targetAudience: generated.targetAudience,
				keywords: generated.adCopy.keywords,
				adCopy: `${generated.adCopy.headline}\n\n${generated.adCopy.description}\n\n${generated.adCopy.callToAction}`,
				aiGenerated: true,
			});

			// Incrementar uso
			await incrementUsage(organizationId, "adCampaigns");

			// Log de éxito
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "SUCCESS",
				category: "ads",
				message: `Ad campaign created: ${generated.name}`,
				metadata: {
					campaignId: campaign.id,
					platform,
					goal,
				},
			});

			return {
				campaign,
				recommendations: generated.recommendations,
				estimatedPerformance: generated.estimatedPerformance,
			};
		} catch (error) {
			// Log de error
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "ERROR",
				category: "ads",
				message: `Error creating ad campaign: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});

