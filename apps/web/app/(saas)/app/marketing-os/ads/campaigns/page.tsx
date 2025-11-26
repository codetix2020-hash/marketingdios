/**
 * MarketingOS - Modo Dios
 * Página de lista de campañas publicitarias
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CampaignsPage() {
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
				title="Campañas Publicitarias"
				subtitle="Gestiona y optimiza tus campañas de anuncios"
			/>

			<div className="space-y-6 mt-6">
				<div className="flex justify-between items-center">
					<h2 className="text-2xl font-semibold">Tus Campañas</h2>
					<Link href="/marketing-os/ads/create">
						<Button>Nueva Campaña</Button>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Campañas Activas</CardTitle>
						<CardDescription>
							Aquí aparecerán tus campañas publicitarias activas y su rendimiento
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							No hay campañas activas. Crea tu primera campaña para comenzar.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

