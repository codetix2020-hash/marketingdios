/**
 * MarketingOS - Modo Dios
 * Página de logs avanzados
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";
import { AdvancedLogsView } from "./components/AdvancedLogsView";

export default async function LogsPage() {
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
				title="Logs Avanzados"
				subtitle="Sistema de logs inteligentes con resúmenes y recomendaciones"
			/>

			<AdvancedLogsView organizationId={activeOrganizationId} />
		</div>
	);
}

