/**
 * MarketingOS - Modo Dios
 * Sección de KPIs del dashboard
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { BarChart3 } from "lucide-react";

interface KPIsSectionProps {
	kpis: any;
}

export function KPIsSection({ kpis }: KPIsSectionProps) {
	if (!kpis) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>KPIs</CardTitle>
					<CardDescription>No hay datos disponibles</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					KPIs Detallados
				</CardTitle>
				<CardDescription>Métricas de marketing en tiempo real</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<p className="text-sm font-medium text-muted-foreground">Contenido por Tipo</p>
						<div className="mt-2 space-y-1">
							<div className="flex justify-between text-sm">
								<span>Emails:</span>
								<span className="font-medium">{kpis.contentByType?.EMAIL || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Posts:</span>
								<span className="font-medium">{kpis.contentByType?.POST || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Reels:</span>
								<span className="font-medium">{kpis.contentByType?.REEL || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Blogs:</span>
								<span className="font-medium">{kpis.contentByType?.BLOG || 0}</span>
							</div>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-muted-foreground">Estadísticas</p>
						<div className="mt-2 space-y-1">
							<div className="flex justify-between text-sm">
								<span>Total Contenido:</span>
								<span className="font-medium">{kpis.totalContent || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Publicados:</span>
								<span className="font-medium">{kpis.publishedContent || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Campañas Activas:</span>
								<span className="font-medium">{kpis.activeCampaigns || 0}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Total Campañas:</span>
								<span className="font-medium">{kpis.totalCampaigns || 0}</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

