/**
 * MarketingOS - Modo Dios
 * Endpoint TEMPORAL para configurar GOD_MODE
 * 
 * ⚠️ IMPORTANTE: Borra este archivo después de usarlo en producción
 */

import { db } from "@repo/database";
import { NextResponse } from "next/server";

// Este endpoint es TEMPORAL - bórralo después de usarlo
export async function POST(request: Request) {
	try {
		const { organizationId } = await request.json();

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId es requerido" },
				{ status: 400 },
			);
		}

		// Verificar que la organización existe
		const org = await db.organization.findUnique({
			where: { id: organizationId },
		});

		if (!org) {
			return NextResponse.json(
				{ error: "Organización no encontrada" },
				{ status: 404 },
			);
		}

		// Crear/actualizar configuración GOD_MODE
		const config = await db.marketingConfig.upsert({
			where: { organizationId },
			update: {
				planType: "GOD_MODE",
				autoPilotEnabled: true,
				autoPilotFrequency: "30m",
				aiModel: "gpt-4o",
				optimizationFrequency: "30m",
				reportFrequency: "daily",
			},
			create: {
				organizationId,
				planType: "GOD_MODE",
				autoPilotEnabled: true,
				autoPilotFrequency: "30m",
				aiModel: "gpt-4o",
				optimizationFrequency: "30m",
				reportFrequency: "daily",
			},
		});

		// Inicializar uso mensual
		const now = new Date();
		const month = now.getMonth() + 1;
		const year = now.getFullYear();

		await db.marketingUsage.upsert({
			where: {
				organizationId_month_year: {
					organizationId,
					month,
					year,
				},
			},
			update: {},
			create: {
				organizationId,
				month,
				year,
				contentGenerated: 0,
				seoAnalyses: 0,
				adCampaigns: 0,
				publications: 0,
			},
		});

		return NextResponse.json({
			success: true,
			organization: org.name,
			config: config.planType,
			message: "✅ GOD_MODE configurado correctamente",
		});
	} catch (error) {
		console.error("Error setup GOD_MODE:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

// Endpoint GET para verificar configuración
export async function GET() {
	try {
		const orgs = await db.organization.findMany({
			include: {
				marketingConfig: true,
			},
			take: 10,
		});

		return NextResponse.json({
			organizations: orgs.map((org) => ({
				id: org.id,
				name: org.name,
				slug: org.slug,
				plan: org.marketingConfig?.planType || "NO_CONFIGURADO",
			})),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

