/**
 * MarketingOS - Modo Dios
 * Seed de prueba para desarrollo
 */

import { db } from "./client";

async function main() {
	console.log("🌱 Iniciando seed de MarketingOS...");

	// Crear workspace de prueba GOD_MODE
	const workspace = await db.organization.upsert({
		where: { id: "test-workspace" },
		update: {},
		create: {
			id: "test-workspace",
			name: "CODETIX Internal",
			slug: "codetix-internal",
			createdAt: new Date(),
		},
	});

	console.log("✅ Workspace creado:", workspace.name);

	// Crear configuración GOD_MODE
	const config = await db.marketingConfig.upsert({
		where: { organizationId: workspace.id },
		update: {
			planType: "GOD_MODE",
			autoPilotEnabled: true,
			autoPilotFrequency: "30m",
			aiModel: "gpt-4o",
			optimizationFrequency: "30m",
			reportFrequency: "daily",
		},
		create: {
			organizationId: workspace.id,
			planType: "GOD_MODE",
			autoPilotEnabled: true,
			autoPilotFrequency: "30m",
			aiModel: "gpt-4o",
			optimizationFrequency: "30m",
			reportFrequency: "daily",
		},
	});

	console.log("✅ Configuración GOD_MODE creada");

	// Crear uso inicial para el mes actual
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	await db.marketingUsage.upsert({
		where: {
			organizationId_month_year: {
				organizationId: workspace.id,
				month,
				year,
			},
		},
		update: {},
		create: {
			organizationId: workspace.id,
			month,
			year,
			contentGenerated: 0,
			seoAnalyses: 0,
			adCampaigns: 0,
			publications: 0,
		},
	});

	console.log("✅ Uso mensual inicializado");

	console.log("🎉 Seed completado exitosamente");
}

main()
	.catch((e) => {
		console.error("❌ Error en seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});

