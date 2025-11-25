/**
 * MarketingOS - Modo Dios
 * Página de generación de contenido
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";
import { ContentGenerator } from "./components/ContentGenerator";

export default async function GenerateContentPage() {
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
				title="Generar Contenido con IA"
				subtitle="Crea contenido de marketing profesional usando inteligencia artificial"
			/>

			<ContentGenerator organizationId={activeOrganizationId} />
		</div>
	);
}

