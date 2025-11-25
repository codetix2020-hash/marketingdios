/**
 * MarketingOS - Modo Dios
 * Procedimiento para generar contenido de marketing usando IA
 */

import { ORPCError } from "@orpc/client";
import { createMarketingContent, createMarketingLog } from "@repo/database";
import { generateMarketingContent } from "../../../src/lib/ai/marketing";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const generateContent = protectedProcedure
	.route({
		method: "POST",
		path: "/marketing/content/generate",
		tags: ["Marketing"],
		summary: "Generate marketing content",
		description: "Generate marketing content (email, post, reel, blog) using AI",
	})
	.input(
		z.object({
			organizationId: z.string(),
			type: z.enum(["EMAIL", "POST", "REEL", "BLOG"]),
			topic: z.string().min(1),
			tone: z.string().optional(),
			targetAudience: z.string().optional(),
			length: z.enum(["short", "medium", "long"]).optional(),
			keywords: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, type, topic, tone, targetAudience, length, keywords } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		// Verificar límites
		const { canUseFeature, incrementUsage } = await import("../../../src/lib/marketing");
		const limitCheck = await canUseFeature(organizationId, "content");
		if (!limitCheck.allowed) {
			throw new ORPCError("FORBIDDEN", limitCheck.reason);
		}

		try {
			// Generar contenido usando IA
			const generated = await generateMarketingContent({
				type,
				topic,
				tone,
				targetAudience,
				length: length || "medium",
				keywords: keywords || [],
				organizationContext: membership.organization.name,
			});

			// Guardar en base de datos
			const content = await createMarketingContent({
				organizationId,
				userId: user.id,
				type,
				status: "GENERATED",
				title: generated.title,
				content: generated.content,
				metadata: generated.metadata,
				aiPrompt: `Generate ${type} about ${topic}`,
				aiModel: "gpt-4o-mini",
			});

			// Incrementar uso
			await incrementUsage(organizationId, "content");

			// Log de éxito
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "SUCCESS",
				category: "content",
				message: `Content generated: ${type} - ${generated.title}`,
				metadata: {
					contentId: content.id,
					type,
				},
			});

			return { content };
		} catch (error) {
			// Log de error
			await createMarketingLog({
				organizationId,
				userId: user.id,
				level: "ERROR",
				category: "content",
				message: `Error generating content: ${error instanceof Error ? error.message : "Unknown error"}`,
			});

			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});

