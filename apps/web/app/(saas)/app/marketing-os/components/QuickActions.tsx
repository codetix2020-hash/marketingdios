/**
 * MarketingOS - Modo Dios
 * Acciones rápidas del dashboard
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Plus, Search, Megaphone, FileText } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
	organizationId: string;
}

export function QuickActions({ organizationId }: QuickActionsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Acciones Rápidas</CardTitle>
				<CardDescription>Accede rápidamente a las funciones principales</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<Link href={`/marketing-os/content/generate`}>
					<Button variant="outline" className="w-full justify-start">
						<FileText className="mr-2 h-4 w-4" />
						Generar Contenido
					</Button>
				</Link>

				<Link href={`/marketing-os/seo/analyze`}>
					<Button variant="outline" className="w-full justify-start">
						<Search className="mr-2 h-4 w-4" />
						Analizar SEO
					</Button>
				</Link>

				<Link href={`/marketing-os/ads/create`}>
					<Button variant="outline" className="w-full justify-start">
						<Megaphone className="mr-2 h-4 w-4" />
						Crear Campaña ADS
					</Button>
				</Link>

				<Link href={`/marketing-os/publications`}>
					<Button variant="outline" className="w-full justify-start">
						<Plus className="mr-2 h-4 w-4" />
						Programar Publicación
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}

