/**
 * MarketingOS - Modo Dios
 * Página para programar publicaciones en redes sociales
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { redirect } from "next/navigation";

export default async function SchedulePage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id;

	if (!activeOrganizationId) {
		redirect("/new-organization");
	}

	return (
		<div>
			<PageHeader
				title="Programar Publicaciones"
				subtitle="Programa y gestiona tus publicaciones en redes sociales"
			/>

			<div className="space-y-6 mt-6">
				<div className="flex justify-between items-center">
					<h2 className="text-2xl font-semibold">Calendario de Publicaciones</h2>
					<Button>Nueva Publicación</Button>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Calendario</CardTitle>
							<CardDescription>
								Visualiza tus publicaciones programadas
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								El calendario de publicaciones aparecerá aquí
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Publicaciones Pendientes</CardTitle>
							<CardDescription>
								Próximas publicaciones programadas
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								No hay publicaciones programadas
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

