import Anthropic from "@anthropic-ai/sdk";
import { searchMemory } from "./embeddings";
import { db } from "@repo/database";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface OrchestrationContext {
	organizationId: string;
	recentMetrics: any;
	pendingTasks: string[];
}

export async function orchestrate(context: OrchestrationContext) {
	// 1. Recuperar memoria relevante
	const businessDNA = await searchMemory(
		context.organizationId,
		"business identity products services tone",
		"business_dna",
		3,
	);

	const recentLearnings = await searchMemory(
		context.organizationId,
		"successful content high performing",
		"learning",
		5,
	);

	const trendingStructures = await db.viralBlueprint.findMany({
		take: 10,
		orderBy: { extractedAt: "desc" },
	});

	// 2. Construir contexto para decisión
	const orchestrationPrompt = `
Eres el Meta-Agente Orquestador de MarketingOS.

CONTEXTO DE NEGOCIO:
${businessDNA.map((m: any) => m.content).join("\n\n")}

APRENDIZAJES RECIENTES:
${recentLearnings.map((m: any) => m.content).join("\n\n")}

MÉTRICAS ÚLTIMAS 24H:
${JSON.stringify(context.recentMetrics, null, 2)}

ESTRUCTURAS VIRALES DETECTADAS:
${trendingStructures.map((t) => `${t.platform}: ${t.hook}`).join("\n")}

TAREAS PENDIENTES:
${context.pendingTasks.join("\n")}

DECISIÓN REQUERIDA:
Analiza toda la información y decide:
1. ¿Qué contenido crear en las próximas 6 horas?
2. ¿Qué campañas optimizar/pausar?
3. ¿Qué tendencias incorporar?
4. ¿Qué aprendizajes aplicar?

Responde en JSON:
{
  "contentPlan": [
    {
      "type": "post/ad/email",
      "platform": "instagram/facebook/etc",
      "topic": "...",
      "viralHook": "estructura a usar",
      "priority": 1-10,
      "reasoning": "..."
    }
  ],
  "campaignActions": [
    {
      "campaignId": "...",
      "action": "optimize/pause/scale",
      "reasoning": "..."
    }
  ],
  "learningsToApply": ["..."],
  "newAutomations": ["..."]
}
`;

	const decision = await anthropic.messages.create({
		model: "claude-opus-4-20250514",
		max_tokens: 4000,
		messages: [{ role: "user", content: orchestrationPrompt }],
	});

	const decisionText =
		decision.content[0].type === "text" ? decision.content[0].text : "{}";
	const decisionJSON = JSON.parse(decisionText);

	// 3. Guardar decisión
	await db.marketingDecision.create({
		data: {
			agentType: "orchestrator",
			decision: JSON.stringify(decisionJSON),
			reasoning: "Orchestration cycle",
			context: context,
			organizationId: context.organizationId,
		},
	});

	return decisionJSON;
}

async function getRecentMetrics(organizationId: string) {
	// Obtener métricas de las últimas 24 horas
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	const kpis = await db.marketingKpi.findMany({
		where: {
			organizationId,
			createdAt: { gte: yesterday },
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	return kpis;
}

async function getPendingTasks(organizationId: string) {
	// Obtener tareas pendientes
	const campaigns = await db.marketingAdCampaign.findMany({
		where: {
			organizationId,
			status: "DRAFT",
		},
		select: { id: true, name: true },
	});

	const scheduledPosts = await db.marketingPublication.findMany({
		where: {
			organizationId,
			status: "SCHEDULED",
			scheduledAt: { gte: new Date() },
		},
		select: { id: true, platform: true },
		take: 5,
	});

	return [
		...campaigns.map((c) => `Campaign draft: ${c.name}`),
		...scheduledPosts.map((p) => `Scheduled post: ${p.platform}`),
	];
}

export { getRecentMetrics, getPendingTasks };

