/**
 * MarketingOS - Modo Dios
 * Sección de logs del sistema
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

interface LogsSectionProps {
	logs: any[];
	organizationId: string;
}

const levelIcons = {
	INFO: Info,
	SUCCESS: CheckCircle2,
	WARNING: AlertCircle,
	ERROR: XCircle,
};

const levelColors = {
	INFO: "bg-blue-500/10 text-blue-500",
	SUCCESS: "bg-green-500/10 text-green-500",
	WARNING: "bg-yellow-500/10 text-yellow-500",
	ERROR: "bg-red-500/10 text-red-500",
};

export function LogsSection({ logs: initialLogs, organizationId }: LogsSectionProps) {
	const { data: logsData } = useQuery(
		orpc.marketing.logs.list.queryOptions({
			input: {
				organizationId,
				limit: 100,
			},
		}),
	);

	const logs = logsData?.logs || initialLogs;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Logs del Sistema</CardTitle>
				<CardDescription>Registro de actividades y eventos de MarketingOS</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{logs.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No hay logs disponibles
						</p>
					) : (
						logs.map((log) => {
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
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}

