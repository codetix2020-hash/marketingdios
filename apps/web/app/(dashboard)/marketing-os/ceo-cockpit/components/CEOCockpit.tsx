/**
 * MarketingOS - Modo Dios Supremo
 * Componente CEO Cockpit
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap, Target, Shield, Lightbulb } from "lucide-react";
import { Skeleton } from "@ui/components/skeleton";

interface CEOCockpitProps {
	organizationId: string;
}

export function CEOCockpit({ organizationId }: CEOCockpitProps) {
	const { data: insights, isLoading } = useQuery({
		queryKey: ["ceo-cockpit", organizationId],
		queryFn: async () => {
			// En producción, esto llamaría a un endpoint oRPC
			// Por ahora, simulamos los datos
			return {
				businessStatus: {
					overallHealth: "good" as const,
					score: 75,
					summary: "El negocio está en buen estado con oportunidades de crecimiento",
					keyMetrics: [
						{ label: "Performance Score", value: 75, trend: "up" as "up" | "down" | "stable" },
						{ label: "Contenido Generado", value: 42, trend: "up" as "up" | "down" | "stable" },
						{ label: "Campañas Activas", value: 3, trend: "stable" as "up" | "down" | "stable" },
					],
				},
				opportunities: [
					{
						id: "opp1",
						title: "Expansión de contenido a TikTok",
						description: "Hay una oportunidad de llegar a una audiencia más joven",
						potentialImpact: "high" as const,
						effort: "medium" as const,
						estimatedROI: "Aumento del 30% en engagement",
						category: "content",
					},
				],
				risks: [
					{
						id: "risk1",
						title: "Baja tasa de conversión en campañas",
						description: "Las campañas actuales tienen un CTR bajo",
						severity: "medium" as const,
						probability: "medium" as const,
						mitigation: "Optimizar copy y targeting",
						category: "ads",
					},
				],
				recommendations: [
					{
						priority: "high" as const,
						action: "Optimizar campañas de ads existentes",
						expectedImpact: "Aumento del 25% en conversiones",
						estimatedTime: "2-4 horas",
					},
				],
				nextSteps: [
					{
						action: "Optimización automática programada",
						automated: true,
						scheduledFor: new Date(Date.now() + 30 * 60 * 1000),
						description: "El sistema ejecutará optimizaciones en 30 minutos",
					},
				],
			};
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!insights) {
		return <div>Error al cargar insights</div>;
	}

	const healthColors = {
		excellent: "bg-green-500/10 text-green-500 border-green-500",
		good: "bg-blue-500/10 text-blue-500 border-blue-500",
		warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
		critical: "bg-red-500/10 text-red-500 border-red-500",
	};

	const healthIcons = {
		excellent: CheckCircle2,
		good: TrendingUp,
		warning: AlertTriangle,
		critical: AlertTriangle,
	};

	const HealthIcon = healthIcons[insights.businessStatus.overallHealth];

	return (
		<div className="space-y-6">
			{/* Estado del Negocio */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<HealthIcon className={`h-5 w-5 ${healthColors[insights.businessStatus.overallHealth]}`} />
						Estado Actual del Negocio
					</CardTitle>
					<CardDescription>{insights.businessStatus.summary}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Score General</span>
							<div className="flex items-center gap-2">
								<span className="text-3xl font-bold">{insights.businessStatus.score}</span>
								<Badge className={healthColors[insights.businessStatus.overallHealth]}>
									{insights.businessStatus.overallHealth.toUpperCase()}
								</Badge>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							{insights.businessStatus.keyMetrics.map((metric, i) => (
								<div key={i} className="p-4 border rounded-lg">
									<div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
									<div className="flex items-center gap-2">
										<span className="text-2xl font-bold">{metric.value}</span>
									{metric.trend === "up" && (
										<TrendingUp className="h-4 w-4 text-green-500" />
									)}
									{metric.trend === "down" && (
										<TrendingDown className="h-4 w-4 text-red-500" />
									)}
									{metric.trend === "stable" && (
										<div className="h-4 w-4 rounded-full bg-gray-400" />
									)}
									</div>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs con Oportunidades, Riesgos, Recomendaciones */}
			<Tabs defaultValue="opportunities" className="space-y-4">
				<TabsList>
					<TabsTrigger value="opportunities">
						<Lightbulb className="mr-2 h-4 w-4" />
						Oportunidades
					</TabsTrigger>
					<TabsTrigger value="risks">
						<Shield className="mr-2 h-4 w-4" />
						Riesgos
					</TabsTrigger>
					<TabsTrigger value="recommendations">
						<Target className="mr-2 h-4 w-4" />
						Recomendaciones
					</TabsTrigger>
					<TabsTrigger value="nextSteps">
						<Zap className="mr-2 h-4 w-4" />
						Próximos Pasos
					</TabsTrigger>
				</TabsList>

				<TabsContent value="opportunities">
					<div className="grid gap-4 md:grid-cols-2">
						{insights.opportunities.map((opp) => (
							<Card key={opp.id}>
								<CardHeader>
									<CardTitle className="text-lg">{opp.title}</CardTitle>
									<CardDescription>{opp.description}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									<div className="flex items-center gap-2">
									<Badge>Impacto: {opp.potentialImpact}</Badge>
									<Badge>Esfuerzo: {opp.effort}</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										ROI Estimado: {opp.estimatedROI}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="risks">
					<div className="grid gap-4 md:grid-cols-2">
						{insights.risks.map((risk) => (
							<Card key={risk.id}>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-yellow-500" />
										{risk.title}
									</CardTitle>
									<CardDescription>{risk.description}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									<div className="flex items-center gap-2">
									<Badge className="bg-red-500/10 text-red-500">
										Severidad: {risk.severity}
									</Badge>
									<Badge>Probabilidad: {risk.probability}</Badge>
									</div>
									<p className="text-sm">
										<strong>Mitigación:</strong> {risk.mitigation}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="recommendations">
					<div className="space-y-4">
						{insights.recommendations.map((rec, i) => (
							<Card key={i}>
								<CardContent className="pt-6">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<Badge
													className={
														rec.priority === "high"
															? "bg-red-500/10 text-red-500"
															: rec.priority === "medium"
																? "bg-yellow-500/10 text-yellow-500"
																: "bg-blue-500/10 text-blue-500"
													}
												>
													{rec.priority.toUpperCase()}
												</Badge>
											</div>
											<h4 className="font-semibold mb-1">{rec.action}</h4>
											<p className="text-sm text-muted-foreground mb-2">
												{rec.expectedImpact}
											</p>
											<p className="text-xs text-muted-foreground">
												Tiempo estimado: {rec.estimatedTime}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="nextSteps">
					<div className="space-y-4">
						{insights.nextSteps.map((step, i) => (
							<Card key={i}>
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										{step.automated ? (
											<Zap className="h-5 w-5 text-blue-500 mt-0.5" />
										) : (
											<Target className="h-5 w-5 text-gray-500 mt-0.5" />
										)}
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-semibold">{step.action}</h4>
												{step.automated && (
													<Badge className="bg-blue-500/10 text-blue-500">
														Automático
													</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">{step.description}</p>
											{step.scheduledFor && (
												<p className="text-xs text-muted-foreground mt-1">
													Programado para: {new Date(step.scheduledFor).toLocaleString("es-ES")}
												</p>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

