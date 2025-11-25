/**
 * MarketingOS - Modo Dios
 * Seed de producción
 * 
 * Este script configura GOD_MODE para una organización existente
 */

import { db } from "@repo/database";

async function main() {
	console.log("🌱 Creando datos de prueba...");

	// Obtener la primera organización (o crear una de prueba)
	let org = await db.organization.findFirst();

	if (!org) {
		console.log("📝 Creando organización de prueba...");
		org = await db.organization.create({
			data: {
				name: "CODETIX Internal",
				slug: "codetix-internal",
				createdAt: new Date(),
			},
		});
	}

	console.log(`✅ Organización encontrada: ${org.name} (${org.id})`);

	// Crear o actualizar configuración GOD_MODE
	const config = await db.marketingConfig.upsert({
		where: { organizationId: org.id },
		update: {
			planType: "GOD_MODE",
			autoPilotEnabled: true,
			autoPilotFrequency: "30m",
			aiModel: "gpt-4o",
			optimizationFrequency: "30m",
			reportFrequency: "daily",
		},
		create: {
			organizationId: org.id,
			planType: "GOD_MODE",
			autoPilotEnabled: true,
			autoPilotFrequency: "30m",
			aiModel: "gpt-4o",
			optimizationFrequency: "30m",
			reportFrequency: "daily",
		},
	});

	console.log(`✅ Configuración GOD_MODE creada para: ${org.name}`);

	// Inicializar uso mensual
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	await db.marketingUsage.upsert({
		where: {
			organizationId_month_year: {
				organizationId: org.id,
				month,
				year,
			},
		},
		update: {},
		create: {
			organizationId: org.id,
			month,
			year,
			contentGenerated: 0,
			seoAnalyses: 0,
			adCampaigns: 0,
			publications: 0,
		},
	});

	console.log(`✅ Uso mensual inicializado para ${month}/${year}`);
	console.log("\n🎉 Seed completado exitosamente");
	console.log(`\n📌 Tu organización ID es: ${org.id}`);
	console.log("Úsala para configurar tu workspace en el frontend");
}

main()
	.catch((e) => {
		console.error("❌ Error en seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});

