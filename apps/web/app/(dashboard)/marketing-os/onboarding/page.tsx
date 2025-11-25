/**
 * MarketingOS - Modo Dios
 * Onboarding Ultra Rápido
 */

import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./components/OnboardingWizard";

export default async function OnboardingPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id;

	if (!activeOrganizationId) {
		redirect("/new-organization");
	}

	return <OnboardingWizard organizationId={activeOrganizationId} />;
}

