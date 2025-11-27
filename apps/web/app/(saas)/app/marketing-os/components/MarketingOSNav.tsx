/**
 * MarketingOS - Modo Dios
 * Navegación lateral dedicada
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@ui/lib";
import {
	LayoutDashboard,
	FileText,
	Search,
	Megaphone,
	BarChart3,
	FileCheck,
	Zap,
	Settings,
	Sparkles,
} from "lucide-react";

const navItems = [
	{
		title: "Dashboard",
		href: "/app/marketing-os",
		icon: LayoutDashboard,
	},
	{
		title: "Generar Contenido",
		href: "/app/marketing-os/content/generate",
		icon: FileText,
	},
	{
		title: "Análisis SEO",
		href: "/app/marketing-os/seo/analyze",
		icon: Search,
	},
	{
		title: "Campañas ADS",
		href: "/app/marketing-os/ads/create",
		icon: Megaphone,
	},
	{
		title: "CEO Cockpit",
		href: "/app/marketing-os/ceo-cockpit",
		icon: BarChart3,
	},
	{
		title: "Logs",
		href: "/app/marketing-os/logs",
		icon: FileCheck,
	},
	{
		title: "Onboarding",
		href: "/app/marketing-os/onboarding",
		icon: Sparkles,
	},
];

export function MarketingOSNav() {
	const pathname = usePathname();

	return (
		<nav className="space-y-1">
			{navItems.map((item) => {
				const Icon = item.icon;
				const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						<Icon className="h-5 w-5" />
						{item.title}
					</Link>
				);
			})}
		</nav>
	);
}

