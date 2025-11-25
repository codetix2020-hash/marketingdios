/**
 * MarketingOS - Modo Dios
 * Procedimiento para obtener KPIs del dashboard
 */

import { ORPCError } from "@orpc/client";
import { getMarketingKpis, listMarketingContent, listMarketingAdCampaigns } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const getKpis = protectedProcedure
	.route({
		method: "GET",
		path: "/marketing/kpis",
		tags: ["Marketing"],
		summary: "Get marketing KPIs",
		description: "Get marketing KPIs for the dashboard",
	})
	.input(
		z.object({
			organizationId: z.string(),
			startDate: z.string().optional(), // ISO date string
			endDate: z.string().optional(), // ISO date string
		}),
	)
	.handler(async ({ input, context }) => {
		const { organizationId, startDate, endDate } = input;
		const user = context.user;

		// Verificar membresía de la organización
		const membership = await verifyOrganizationMembership(organizationId, user.id);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días por defecto
		const end = endDate ? new Date(endDate) : new Date();

		// Obtener KPIs de la base de datos
		const kpis = await getMarketingKpis({
			organizationId,
			startDate: start,
			endDate: end,
		});

		// Calcular KPIs adicionales en tiempo real
		const [content, campaigns] = await Promise.all([
			listMarketingContent({
				organizationId,
				limit: 1000,
				offset: 0,
			}),
			listMarketingAdCampaigns({
				organizationId,
				limit: 1000,
				offset: 0,
			}),
		]);

		// Calcular métricas
		const totalContent = content.length;
		const publishedContent = content.filter((c) => c.status === "PUBLISHED").length;
		const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
		const totalCampaigns = campaigns.length;

		// Agrupar KPIs por métrica
		const kpisByMetric = kpis.reduce(
			(acc, kpi) => {
				if (!acc[kpi.metric]) {
					acc[kpi.metric] = [];
				}
				acc[kpi.metric].push(kpi);
				return acc;
			},
			{} as Record<string, typeof kpis>,
		);

		// Calcular promedios y totales
		const calculatedKpis = {
			totalContent,
			publishedContent,
			activeCampaigns,
			totalCampaigns,
			contentByType: {
				EMAIL: content.filter((c) => c.type === "EMAIL").length,
				POST: content.filter((c) => c.type === "POST").length,
				REEL: content.filter((c) => c.type === "REEL").length,
				BLOG: content.filter((c) => c.type === "BLOG").length,
			},
			kpisByMetric,
		};

		return { kpis: calculatedKpis, rawKpis: kpis };
	});

