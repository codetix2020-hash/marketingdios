/**
 * MarketingOS - Modo Dios
 * Página para gestionar cuentas de redes sociales
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id;

	if (!activeOrganizationId) {
		redirect("/new-organization");
	}

	const platforms = [
		{ name: "Instagram", icon: "📷" },
		{ name: "Facebook", icon: "👥" },
		{ name: "Twitter", icon: "🐦" },
		{ name: "LinkedIn", icon: "💼" },
		{ name: "TikTok", icon: "🎵" },
		{ name: "YouTube", icon: "▶️" },
	];

	return (
		<div>
			<PageHeader
				title="Cuentas de Redes Sociales"
				subtitle="Conecta y gestiona tus cuentas de redes sociales"
			/>

			<div className="space-y-6 mt-6">
				<div className="flex justify-between items-center">
					<h2 className="text-2xl font-semibold">Plataformas Conectadas</h2>
					<Button>Conectar Cuenta</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{platforms.map((platform) => (
						<Card key={platform.name}>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<span>{platform.icon}</span>
									{platform.name}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Badge status="info" className="w-full justify-center">
									No conectado
								</Badge>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}

