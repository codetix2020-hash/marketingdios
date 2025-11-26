/**
 * MarketingOS - Modo Dios
 * Componente principal del dashboard con KPIs y logs
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Activity, BarChart3, FileText, Megaphone, TrendingUp } from "lucide-react";
import { KPIsSection } from "./KPIsSection";
import { LogsSection } from "./LogsSection";
import { QuickActions } from "./QuickActions";

interface MarketingOSDashboardProps {
	organizationId: string;
	initialKpis: any;
	initialLogs: any[];
}

export function MarketingOSDashboard({
	organizationId,
	initialKpis,
	initialLogs,
}: MarketingOSDashboardProps) {
	const { data: kpisData } = useQuery(
		orpc.marketing.kpis.get.queryOptions({
			input: {
				organizationId,
			},
		}),
	);

	const { data: logsData } = useQuery(
		orpc.marketing.logs.list.queryOptions({
			input: {
				organizationId,
				limit: 100,
			},
		}),
	);

	const kpis = kpisData?.kpis || initialKpis;
	const logs = logsData?.logs || initialLogs;

	return (
		<div className="space-y-6">
			{/* KPIs principales */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Contenido Total</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{kpis?.totalContent || 0}</div>
						<p className="text-xs text-muted-foreground">
							{kpis?.publishedContent || 0} publicados
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Campañas Activas</CardTitle>
						<Megaphone className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{kpis?.activeCampaigns || 0}</div>
						<p className="text-xs text-muted-foreground">
							{kpis?.totalCampaigns || 0} totales
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Performance</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">--</div>
						<p className="text-xs text-muted-foreground">En análisis</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Actividad</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{logs.length}</div>
						<p className="text-xs text-muted-foreground">Eventos recientes</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs principales */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Resumen</TabsTrigger>
					<TabsTrigger value="content">Contenido</TabsTrigger>
					<TabsTrigger value="seo">SEO</TabsTrigger>
					<TabsTrigger value="ads">Anuncios</TabsTrigger>
					<TabsTrigger value="logs">Logs</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<KPIsSection kpis={kpis} />
						<QuickActions organizationId={organizationId} />
					</div>
				</TabsContent>

				<TabsContent value="content">
					<Card>
						<CardHeader>
							<CardTitle>Generador de Contenido</CardTitle>
							<CardDescription>
								Genera contenido de marketing usando IA (emails, posts, reels, blogs)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Funcionalidad de generación de contenido - En desarrollo
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="seo">
					<Card>
						<CardHeader>
							<CardTitle>Motor SEO</CardTitle>
							<CardDescription>
								Analiza, optimiza y crea contenido SEO optimizado
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Funcionalidad SEO - En desarrollo
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="ads">
					<Card>
						<CardHeader>
							<CardTitle>Motor ADS</CardTitle>
							<CardDescription>
								Crea y optimiza campañas de anuncios
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Funcionalidad ADS - En desarrollo
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="logs">
					<LogsSection logs={logs} organizationId={organizationId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

