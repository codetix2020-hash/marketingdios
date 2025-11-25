/**
 * MarketingOS - Modo Dios
 * Layout para MarketingOS con navegación lateral
 */

import { AppWrapper } from "@saas/shared/components/AppWrapper";
import type { PropsWithChildren } from "react";
import { MarketingOSNav } from "./components/MarketingOSNav";
import { Card } from "@ui/components/card";

export default function MarketingOSLayout({ children }: PropsWithChildren) {
	return (
		<AppWrapper>
			<div className="flex gap-6">
				{/* Navegación lateral */}
				<aside className="hidden md:block w-64 shrink-0">
					<Card className="p-4 sticky top-4">
						<div className="mb-4">
							<h2 className="text-lg font-bold">MarketingOS</h2>
							<p className="text-xs text-muted-foreground">Modo Dios</p>
						</div>
						<MarketingOSNav />
					</Card>
				</aside>

				{/* Contenido principal */}
				<main className="flex-1 min-w-0">{children}</main>
			</div>
		</AppWrapper>
	);
}

