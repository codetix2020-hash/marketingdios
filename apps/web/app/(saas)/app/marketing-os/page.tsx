/**
 * MarketingOS - Modo Dios
 * Dashboard principal con KPIs y logs
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { orpcClient } from "@shared/lib/orpc-client";
import { redirect } from "next/navigation";
import { MarketingOSDashboard } from "./components/MarketingOSDashboard";

export default async function MarketingOSPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id;

	if (!activeOrganizationId) {
		redirect("/new-organization");
	}

	// Obtener KPIs y logs iniciales
	const [kpisData, logsData] = await Promise.all([
		orpcClient.marketing.kpis.get({
			organizationId: activeOrganizationId,
		}).catch(() => ({ kpis: null, rawKpis: [] })),
		orpcClient.marketing.logs.list({
			organizationId: activeOrganizationId,
			limit: 50,
		}).catch(() => ({ logs: [] })),
	]);

	return (
		<div>
			<PageHeader
				title="MarketingOS - Modo Dios"
				subtitle="Sistema completo de marketing automatizado con IA"
			/>

			<MarketingOSDashboard
				organizationId={activeOrganizationId}
				initialKpis={kpisData.kpis}
				initialLogs={logsData.logs}
			/>
		</div>
	);
}

