/**
 * MarketingOS - Modo Dios
 * Procedimiento para analizar SEO de una URL
 */

import { ORPCError } from "@orpc/client";
import { createMarketingSeo, createMarketingLog, updateMarketingSeo } from "@repo/database";
import { analyzeSeo } from "../../../src/lib/ai/marketing";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const analyzeSeoUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/marketing/seo/analyze",
		tags: ["Marketing"],
		summary: "Analyze SEO",
		description: "Analyze SEO of a URL and generate recommendations",
	})
	.input(
		z.object({
			organizationId: z.string(),
			url: z.string().url(),
			content: z.string().optional(),
			title: z.string().optional(),
			metaDescription: z.string().optional(),
			keywords: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, url, content, title, metaDescription, keywords } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		// Verificar límites
		const { canUseFeature, incrementUsage } = await import("../../../src/lib/marketing");
		const limitCheck = await canUseFeature(organizationId, "seo");
		if (!limitCheck.allowed) {
			throw new ORPCError("FORBIDDEN", limitCheck.reason);
		}

		try {
			// Crear registro de análisis
			const seoRecord = await createMarketingSeo({
				organizationId,
				url,
				status: "ANALYZING",
			});

			// Realizar análisis SEO
			const analysis = await analyzeSeo({
				url,
				content,
				title,
				metaDescription,
				keywords: keywords || [],
			});

			// Actualizar registro con resultados
			const updated = await updateMarketingSeo(seoRecord.id, {
				status: "COMPLETED",
				score: analysis.score,
				analysis: analysis.analysis,
				recommendations: analysis.recommendations,
				optimizedContent: analysis.optimizedContent,
			});

			// Incrementar uso
			await incrementUsage(organizationId, "seo");

			// Log de éxito
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "SUCCESS",
				category: "seo",
				message: `SEO analysis completed for ${url} - Score: ${analysis.score}`,
				metadata: {
					seoId: updated.id,
					score: analysis.score,
				},
			});

			return { seo: updated, analysis };
		} catch (error) {
			// Log de error
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "ERROR",
				category: "seo",
				message: `Error analyzing SEO: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});

