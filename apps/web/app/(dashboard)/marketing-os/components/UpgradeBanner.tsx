/**
 * MarketingOS - Modo Dios
 * Banner de upgrade cuando se alcanzan límites
 */

"use client";

import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";

interface UpgradeBannerProps {
	feature: "content" | "seo" | "adCampaigns";
	limit: number;
	used: number;
}

export function UpgradeBanner({ feature, limit, used }: UpgradeBannerProps) {
	const featureNames = {
		content: "contenidos",
		seo: "análisis SEO",
		adCampaigns: "campañas ADS",
	};

	const percentage = (used / limit) * 100;
	const isNearLimit = percentage >= 80;
	const isAtLimit = percentage >= 100;

	if (!isNearLimit) {
		return null;
	}

	return (
		<Card className={isAtLimit ? "border-red-500 bg-red-500/5" : "border-yellow-500 bg-yellow-500/5"}>
			<CardContent className="pt-6">
				<div className="flex items-start gap-4">
					<AlertTriangle
						className={`h-5 w-5 mt-0.5 ${isAtLimit ? "text-red-500" : "text-yellow-500"}`}
					/>
					<div className="flex-1">
						<h4 className="font-semibold mb-1">
							{isAtLimit
								? `Has alcanzado el límite de ${featureNames[feature]}`
								: `Casi alcanzas el límite de ${featureNames[feature]}`}
						</h4>
						<p className="text-sm text-muted-foreground mb-3">
							Has usado {used} de {limit} {featureNames[feature]} este mes.
							{isAtLimit
								? " Actualiza tu plan para continuar."
								: ` Te quedan ${limit - used} ${featureNames[feature]}.`}
						</p>
						<Link href="/marketing-os/upgrade">
							<Button size="sm" variant={isAtLimit ? "default" : "outline"}>
								<Sparkles className="mr-2 h-4 w-4" />
								Actualizar Plan
							</Button>
						</Link>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

