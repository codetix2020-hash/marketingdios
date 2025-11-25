/**
 * MarketingOS - Modo Dios
 * Página de creación de campañas ADS
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";
import { AdCampaignCreator } from "./components/AdCampaignCreator";

export default async function CreateAdCampaignPage() {
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
				title="Crear Campaña de Anuncios"
				subtitle="Crea y optimiza campañas publicitarias con IA"
			/>

			<AdCampaignCreator organizationId={activeOrganizationId} />
		</div>
	);
}

