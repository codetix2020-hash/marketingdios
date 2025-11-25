/**
 * MarketingOS - Modo Dios
 * Componente de creación de campañas ADS
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Megaphone, Loader2, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdCampaignCreatorProps {
	organizationId: string;
}

export function AdCampaignCreator({ organizationId }: AdCampaignCreatorProps) {
	const [formData, setFormData] = useState({
		platform: "FACEBOOK_ADS" as "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS" | "TWITTER_ADS",
		product: "",
		service: "",
		targetAudience: "",
		goal: "CONVERSIONS" as "AWARENESS" | "CONVERSIONS" | "LEADS" | "SALES" | "ENGAGEMENT",
		budget: "",
		keywords: "",
		tone: "professional",
	});
	const [campaign, setCampaign] = useState<any>(null);
	const [isCreating, setIsCreating] = useState(false);

	const createMutation = useMutation(
		orpc.marketing.ads.createCampaign.mutationOptions(),
	);

	const handleCreate = async () => {
		if (!formData.product && !formData.service) {
			toast.error("Por favor, ingresa un producto o servicio");
			return;
		}

		setIsCreating(true);
		setCampaign(null);

		try {
			const result = await createMutation.mutateAsync({
				organizationId,
				platform: formData.platform,
				product: formData.product || undefined,
				service: formData.service || undefined,
				targetAudience: formData.targetAudience || undefined,
				goal: formData.goal,
				budget: formData.budget ? parseFloat(formData.budget) : undefined,
				keywords: formData.keywords
					.split(",")
					.map((k) => k.trim())
					.filter((k) => k.length > 0),
				tone: formData.tone,
			});

			if (result.campaign) {
				setCampaign(result);
				toast.success("¡Campaña creada exitosamente!");
			}
		} catch (error) {
			toast.error("Error al crear la campaña. Intenta nuevamente.");
			console.error(error);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2">
				{/* Formulario */}
				<Card>
					<CardHeader>
						<CardTitle>Configuración de Campaña</CardTitle>
						<CardDescription>
							Configura los parámetros de tu campaña publicitaria
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="platform">Plataforma *</Label>
							<Select
								value={formData.platform}
								onValueChange={(value: any) =>
									setFormData({ ...formData, platform: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
									<SelectItem value="FACEBOOK_ADS">Facebook Ads</SelectItem>
									<SelectItem value="INSTAGRAM_ADS">Instagram Ads</SelectItem>
									<SelectItem value="LINKEDIN_ADS">LinkedIn Ads</SelectItem>
									<SelectItem value="TWITTER_ADS">Twitter Ads</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="goal">Objetivo *</Label>
							<Select
								value={formData.goal}
								onValueChange={(value: any) =>
									setFormData({ ...formData, goal: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="AWARENESS">Awareness (Conocimiento)</SelectItem>
									<SelectItem value="CONVERSIONS">Conversiones</SelectItem>
									<SelectItem value="LEADS">Leads</SelectItem>
									<SelectItem value="SALES">Ventas</SelectItem>
									<SelectItem value="ENGAGEMENT">Engagement</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="product">Producto</Label>
							<Input
								id="product"
								placeholder="Nombre del producto"
								value={formData.product}
								onChange={(e) => setFormData({ ...formData, product: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="service">Servicio</Label>
							<Input
								id="service"
								placeholder="Nombre del servicio"
								value={formData.service}
								onChange={(e) => setFormData({ ...formData, service: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="targetAudience">Audiencia Objetivo</Label>
							<Input
								id="targetAudience"
								placeholder="Ej: Emprendedores de 25-40 años interesados en marketing"
								value={formData.targetAudience}
								onChange={(e) =>
									setFormData({ ...formData, targetAudience: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="budget">Presupuesto ($)</Label>
							<Input
								id="budget"
								type="number"
								placeholder="1000"
								value={formData.budget}
								onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="keywords">Keywords (separadas por comas)</Label>
							<Input
								id="keywords"
								placeholder="marketing, digital, estrategia"
								value={formData.keywords}
								onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="tone">Tono</Label>
							<Select
								value={formData.tone}
								onValueChange={(value) => setFormData({ ...formData, tone: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="professional">Profesional</SelectItem>
									<SelectItem value="casual">Casual</SelectItem>
									<SelectItem value="friendly">Amigable</SelectItem>
									<SelectItem value="urgent">Urgente</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button
							onClick={handleCreate}
							disabled={isCreating || (!formData.product && !formData.service)}
							className="w-full"
						>
							{isCreating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creando...
								</>
							) : (
								<>
									<Megaphone className="mr-2 h-4 w-4" />
									Crear Campaña con IA
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{/* Resultado */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Target className="h-5 w-5" />
							Campaña Generada
						</CardTitle>
						<CardDescription>
							Revisa la campaña generada y sus recomendaciones
						</CardDescription>
					</CardHeader>
					<CardContent>
						{campaign ? (
							<div className="space-y-4">
								<div>
									<h3 className="font-semibold text-lg mb-2">
										{campaign.campaign.name}
									</h3>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
										<Badge>{campaign.campaign.platform}</Badge>
										<Badge>{campaign.campaign.status}</Badge>
										</div>
										<div className="prose prose-sm max-w-none">
											<pre className="whitespace-pre-wrap text-sm">
												{campaign.campaign.adCopy}
											</pre>
										</div>
									</div>
								</div>

								{campaign.recommendations && campaign.recommendations.length > 0 && (
									<div className="space-y-2">
										<h4 className="font-semibold text-sm">Recomendaciones:</h4>
										<ul className="text-sm space-y-1">
											{campaign.recommendations.map((rec: string, i: number) => (
												<li key={i} className="flex items-start gap-2">
													<span>•</span>
													<span>{rec}</span>
												</li>
											))}
										</ul>
									</div>
								)}

								{campaign.estimatedPerformance && (
									<div className="space-y-2 p-4 bg-muted rounded-lg">
										<h4 className="font-semibold text-sm flex items-center gap-2">
											<TrendingUp className="h-4 w-4" />
											Performance Estimado:
										</h4>
										<div className="text-sm space-y-1">
											<p>CTR: {campaign.estimatedPerformance.ctr}%</p>
											<p>CPC: ${campaign.estimatedPerformance.cpc}</p>
											<p>
												Conversiones estimadas:{" "}
												{campaign.estimatedPerformance.conversions}
											</p>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="text-center py-12 text-muted-foreground">
								<p>La campaña generada aparecerá aquí</p>
								<p className="text-xs mt-2">
									Completa el formulario y haz clic en "Crear Campaña con IA"
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

