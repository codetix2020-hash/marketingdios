/**
 * MarketingOS - Modo Dios
 * Página de análisis SEO
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";
import { SEOAnalyzer } from "./components/SEOAnalyzer";

export default async function SEOAnalyzePage() {
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
				title="Análisis SEO"
				subtitle="Analiza, optimiza y mejora el SEO de tus URLs"
			/>

			<SEOAnalyzer organizationId={activeOrganizationId} />
		</div>
	);
}

