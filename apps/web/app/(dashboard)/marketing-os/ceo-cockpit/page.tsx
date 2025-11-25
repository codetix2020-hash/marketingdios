/**
 * MarketingOS - Modo Dios Supremo
 * Panel CEO Cockpit
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { orpcClient } from "@shared/lib/orpc-client";
import { redirect } from "next/navigation";
import { CEOCockpit } from "./components/CEOCockpit";

export default async function CEOCockpitPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id;

	if (!activeOrganizationId) {
		redirect("/new-organization");
	}

	// Verificar si tiene acceso (solo GOD_MODE o super-admin)
	// Por ahora, permitimos acceso a todos, pero en producción debería verificar

	return (
		<div>
			<PageHeader
				title="CEO Cockpit - Modo Dios Supremo"
				subtitle="Vista ejecutiva del estado del negocio y oportunidades"
			/>

			<CEOCockpit organizationId={activeOrganizationId} />
		</div>
	);
}

