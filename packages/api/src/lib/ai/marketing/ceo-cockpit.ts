/**
 * MarketingOS - Modo Dios Supremo
 * Panel CEO Cockpit
 * 
 * Genera insights ejecutivos de alto nivel:
 * - Estado actual del negocio
 * - Oportunidades detectadas
 * - Riesgos detectados
 * - Recomendaciones accionables
 * - Próximos pasos automáticos
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { analyzePerformance, detectContentGaps, recommendActions, updateStrategies } from "./agent";
import { getMarketingKpis, listMarketingContent, listMarketingAdCampaigns, listMarketingLogs } from "@repo/database";
import { isGodMode } from "../limits";

export interface BusinessStatus {
	overallHealth: "excellent" | "good" | "warning" | "critical";
	score: number; // 0-100
	summary: string;
	keyMetrics: {
		label: string;
		value: string | number;
		trend: "up" | "down" | "stable";
	}[];
}

export interface Opportunity {
	id: string;
	title: string;
	description: string;
	potentialImpact: "high" | "medium" | "low";
	effort: "low" | "medium" | "high";
	estimatedROI: string;
	category: string;
}

export interface Risk {
	id: string;
	title: string;
	description: string;
	severity: "critical" | "high" | "medium" | "low";
	probability: "high" | "medium" | "low";
	mitigation: string;
	category: string;
}

export interface CEOInsights {
	businessStatus: BusinessStatus;
	opportunities: Opportunity[];
	risks: Risk[];
	recommendations: Array<{
		priority: "high" | "medium" | "low";
		action: string;
		expectedImpact: string;
		estimatedTime: string;
	}>;
	nextSteps: Array<{
		action: string;
		automated: boolean;
		scheduledFor?: Date;
		description: string;
	}>;
}

/**
 * Genera insights completos para el CEO Cockpit
 */
export async function generateCEOCockpit(
	organizationId: string,
): Promise<CEOInsights> {
	const isGodModeOrg = await isGodMode(organizationId);

	// Recopilar datos
	const [analysis, gaps, actions, strategies, kpis, content, campaigns, logs] = await Promise.all([
		analyzePerformance(organizationId, 30),
		detectContentGaps(organizationId),
		recommendActions(organizationId),
		updateStrategies(organizationId),
		getMarketingKpis({
			organizationId,
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			endDate: new Date(),
		}),
		listMarketingContent({
			organizationId,
			limit: 100,
			offset: 0,
		}),
		listMarketingAdCampaigns({
			organizationId,
			limit: 100,
			offset: 0,
		}),
		listMarketingLogs({
			organizationId,
			limit: 50,
			offset: 0,
		}),
	]);

	// Generar insights usando IA
	const insightsPrompt = `Eres un consultor estratégico de marketing de nivel C-suite. Analiza los siguientes datos y genera insights ejecutivos.

ANÁLISIS DE PERFORMANCE:
- Score general: ${analysis.overallScore}/100
- Fortalezas: ${analysis.strengths.join(", ")}
- Debilidades: ${analysis.weaknesses.join(", ")}
- Tendencias: ${analysis.trends.length} detectadas

GAPS DETECTADOS:
${gaps.map((g) => `- ${g.type}: ${g.description} (${g.severity})`).join("\n")}

RECOMENDACIONES:
${actions.slice(0, 10).map((a) => `- [${a.priority}] ${a.action}`).join("\n")}

ESTRATEGIAS:
${strategies.slice(0, 5).map((s) => `- ${s.area}: ${s.recommendedStrategy}`).join("\n")}

MÉTRICAS:
- Contenido total: ${content.length}
- Campañas activas: ${campaigns.filter((c) => c.status === "ACTIVE").length}
- KPIs registrados: ${kpis.length}
- Eventos recientes: ${logs.length}

Genera un análisis ejecutivo en formato JSON:
{
  "businessStatus": {
    "overallHealth": "excellent|good|warning|critical",
    "score": número 0-100,
    "summary": "resumen ejecutivo de 2-3 oraciones",
    "keyMetrics": [
      {
        "label": "nombre métrica",
        "value": "valor",
        "trend": "up|down|stable"
      }
    ]
  },
  "opportunities": [
    {
      "id": "opp1",
      "title": "título oportunidad",
      "description": "descripción",
      "potentialImpact": "high|medium|low",
      "effort": "low|medium|high",
      "estimatedROI": "descripción ROI",
      "category": "categoría"
    }
  ],
  "risks": [
    {
      "id": "risk1",
      "title": "título riesgo",
      "description": "descripción",
      "severity": "critical|high|medium|low",
      "probability": "high|medium|low",
      "mitigation": "cómo mitigar",
      "category": "categoría"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "acción específica",
      "expectedImpact": "impacto esperado",
      "estimatedTime": "tiempo estimado"
    }
  ],
  "nextSteps": [
    {
      "action": "acción",
      "automated": boolean,
      "scheduledFor": "fecha ISO o null",
      "description": "descripción"
    }
  ]
}`;

	const { text: insightsText } = await generateText({
		model: isGodModeOrg ? openai("gpt-4o") : openai("gpt-4o-mini"),
		prompt: insightsPrompt,
	});

	// Parsear respuesta
	let insights: CEOInsights;
	try {
		const jsonMatch = insightsText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			insights = JSON.parse(jsonMatch[0]);
		} else {
			insights = generateDefaultInsights(analysis, gaps, actions, strategies);
		}
	} catch {
		insights = generateDefaultInsights(analysis, gaps, actions, strategies);
	}

	// Enriquecer con datos reales
	insights.businessStatus.keyMetrics = [
		{
			label: "Score de Performance",
			value: analysis.overallScore,
			trend: analysis.overallScore >= 80 ? "up" : analysis.overallScore >= 60 ? "stable" : "down",
		},
		{
			label: "Contenido Generado",
			value: content.length,
			trend: content.length > 20 ? "up" : "stable",
		},
		{
			label: "Campañas Activas",
			value: campaigns.filter((c) => c.status === "ACTIVE").length,
			trend: campaigns.filter((c) => c.status === "ACTIVE").length > 0 ? "up" : "down",
		},
	];

	return insights;
}

/**
 * Genera insights por defecto si falla el parsing
 */
function generateDefaultInsights(
	analysis: any,
	gaps: any[],
	actions: any[],
	strategies: any[],
): CEOInsights {
	const health = analysis.overallScore >= 80 ? "excellent" : analysis.overallScore >= 60 ? "good" : analysis.overallScore >= 40 ? "warning" : "critical";

	return {
		businessStatus: {
			overallHealth: health,
			score: analysis.overallScore,
			summary: `El negocio tiene un score de ${analysis.overallScore}/100. ${analysis.strengths.length > 0 ? `Fortalezas: ${analysis.strengths.join(", ")}.` : ""} ${analysis.weaknesses.length > 0 ? `Áreas de mejora: ${analysis.weaknesses.join(", ")}.` : ""}`,
			keyMetrics: [],
		},
		opportunities: gaps
			.filter((g) => g.severity === "high")
			.slice(0, 3)
			.map((g, i) => ({
				id: `opp${i + 1}`,
				title: `Resolver: ${g.type}`,
				description: g.description,
				potentialImpact: "high" as const,
				effort: "medium" as const,
				estimatedROI: "Alto impacto en engagement y visibilidad",
				category: "content",
			})),
		risks: analysis.weaknesses.slice(0, 3).map((w: string, i: number) => ({
			id: `risk${i + 1}`,
			title: w,
			description: `Esta debilidad puede afectar el performance general`,
			severity: "medium" as const,
			probability: "medium" as const,
			mitigation: "Implementar las recomendaciones sugeridas",
			category: "performance",
		})),
		recommendations: actions.slice(0, 5).map((a) => ({
			priority: a.priority,
			action: a.action,
			expectedImpact: a.expectedImpact,
			estimatedTime: a.estimatedTime,
		})),
		nextSteps: [
			{
				action: "Ejecutar recomendaciones de alta prioridad",
				automated: false,
				description: "Revisar y ejecutar las acciones recomendadas",
			},
			{
				action: "Optimización automática programada",
				automated: true,
				scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
				description: "El sistema ejecutará optimizaciones automáticas",
			},
		],
	};
}

