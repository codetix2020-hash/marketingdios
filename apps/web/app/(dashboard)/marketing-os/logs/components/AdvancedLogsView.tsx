/**
 * MarketingOS - Modo Dios
 * Vista avanzada de logs con resúmenes inteligentes
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Badge } from "@ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Info, CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdvancedLogsViewProps {
	organizationId: string;
}

const levelIcons = {
	INFO: Info,
	SUCCESS: CheckCircle2,
	WARNING: AlertTriangle,
	ERROR: XCircle,
};

const levelColors = {
	INFO: "bg-blue-500/10 text-blue-500 border-blue-500",
	SUCCESS: "bg-green-500/10 text-green-500 border-green-500",
	WARNING: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
	ERROR: "bg-red-500/10 text-red-500 border-red-500",
};

export function AdvancedLogsView({ organizationId }: AdvancedLogsViewProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedLevel, setSelectedLevel] = useState<string>("all");

	const { data: logsData } = useQuery(
		orpc.marketing.logs.list.queryOptions({
			input: {
				organizationId,
				category: selectedCategory !== "all" ? selectedCategory : undefined,
				level: selectedLevel !== "all" ? (selectedLevel as any) : undefined,
				limit: 200,
			},
		}),
	);

	const logs = logsData?.logs || [];

	// Agrupar logs por categoría
	const logsByCategory = logs.reduce(
		(acc, log) => {
			if (!acc[log.category]) {
				acc[log.category] = [];
			}
			acc[log.category].push(log);
			return acc;
		},
		{} as Record<string, typeof logs>,
	);

	// Estadísticas
	const stats = {
		total: logs.length,
		byLevel: {
			INFO: logs.filter((l) => l.level === "INFO").length,
			SUCCESS: logs.filter((l) => l.level === "SUCCESS").length,
			WARNING: logs.filter((l) => l.level === "WARNING").length,
			ERROR: logs.filter((l) => l.level === "ERROR").length,
		},
	};

	const categories = Array.from(new Set(logs.map((l) => l.category)));

	return (
		<div className="space-y-6">
			{/* Estadísticas */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground">Total Logs</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-blue-500">{stats.byLevel.INFO}</div>
						<p className="text-xs text-muted-foreground">Info</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-green-500">{stats.byLevel.SUCCESS}</div>
						<p className="text-xs text-muted-foreground">Éxitos</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-yellow-500">{stats.byLevel.WARNING}</div>
						<p className="text-xs text-muted-foreground">Advertencias</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-red-500">{stats.byLevel.ERROR}</div>
						<p className="text-xs text-muted-foreground">Errores</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex-1">
							<Select value={selectedCategory} onValueChange={setSelectedCategory}>
								<SelectTrigger>
									<SelectValue placeholder="Todas las categorías" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las categorías</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<Select value={selectedLevel} onValueChange={setSelectedLevel}>
								<SelectTrigger>
									<SelectValue placeholder="Todos los niveles" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los niveles</SelectItem>
									<SelectItem value="INFO">Info</SelectItem>
									<SelectItem value="SUCCESS">Éxito</SelectItem>
									<SelectItem value="WARNING">Advertencia</SelectItem>
									<SelectItem value="ERROR">Error</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Logs por categoría */}
			<Tabs defaultValue="all" className="space-y-4">
				<TabsList>
					<TabsTrigger value="all">Todos</TabsTrigger>
					{categories.map((cat) => (
						<TabsTrigger key={cat} value={cat}>
							{cat}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="all">
					<Card>
						<CardHeader>
							<CardTitle>Todos los Logs</CardTitle>
							<CardDescription>
								{logs.length} logs encontrados
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 max-h-[600px] overflow-y-auto">
								{logs.map((log) => {
									const Icon = levelIcons[log.level as keyof typeof levelIcons] || Info;
									const colorClass = levelColors[log.level as keyof typeof levelColors] || levelColors.INFO;

									return (
										<div
											key={log.id}
											className="flex items-start gap-3 p-3 rounded-lg border bg-card"
										>
											<Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<Badge className={colorClass}>
														{log.level}
													</Badge>
													<span className="text-xs text-muted-foreground">
														{log.category}
													</span>
													<span className="text-xs text-muted-foreground ml-auto">
														{format(new Date(log.createdAt), "PPp", { locale: es })}
													</span>
												</div>
												<p className="text-sm">{log.message}</p>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{categories.map((category) => (
					<TabsContent key={category} value={category}>
						<Card>
							<CardHeader>
								<CardTitle>{category}</CardTitle>
								<CardDescription>
									{logsByCategory[category]?.length || 0} logs
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 max-h-[600px] overflow-y-auto">
									{(logsByCategory[category] || []).map((log) => {
										const Icon = levelIcons[log.level as keyof typeof levelIcons] || Info;
										const colorClass = levelColors[log.level as keyof typeof levelColors] || levelColors.INFO;

										return (
											<div
												key={log.id}
												className="flex items-start gap-3 p-3 rounded-lg border bg-card"
											>
												<Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<Badge className={colorClass}>
															{log.level}
														</Badge>
														<span className="text-xs text-muted-foreground ml-auto">
															{format(new Date(log.createdAt), "PPp", { locale: es })}
														</span>
													</div>
													<p className="text-sm">{log.message}</p>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

