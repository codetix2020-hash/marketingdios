/**
 * MarketingOS - Modo Dios
 * Wizard de Onboarding Ultra Rápido (5 pasos)
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Checkbox } from "@ui/components/checkbox";
import { Progress } from "@ui/components/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OnboardingWizardProps {
	organizationId: string;
}

const STEPS = [
	{ id: 1, title: "Info del Negocio", key: "BUSINESS_INFO" },
	{ id: 2, title: "Redes Sociales", key: "SOCIAL_MEDIA" },
	{ id: 3, title: "Objetivos", key: "OBJECTIVES" },
	{ id: 4, title: "Tono y Estilo", key: "TONE_STYLE" },
	{ id: 5, title: "Activar AutoPilot", key: "AUTOPILOT" },
];

export function OnboardingWizard({ organizationId }: OnboardingWizardProps) {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState({
		// Paso 1: Info del negocio
		businessName: "",
		businessType: "",
		businessDescription: "",
		targetAudience: "",
		// Paso 2: Redes sociales
		socialMedia: [] as string[],
		// Paso 3: Objetivos
		objectives: [] as string[],
		primaryGoal: "",
		// Paso 4: Tono y estilo
		tone: "professional",
		style: "modern",
		brandVoice: "",
		// Paso 5: AutoPilot
		autoPilotEnabled: false,
	});

	const { data: onboarding } = useQuery({
		queryKey: ["marketing-onboarding", organizationId],
		queryFn: async () => {
			// En producción, esto llamaría a un endpoint oRPC
			return null;
		},
	});

	const saveStepMutation = useMutation({
		mutationFn: async (step: number) => {
			// En producción, esto guardaría el progreso
			return { success: true };
		},
	});

	const completeOnboardingMutation = useMutation({
		mutationFn: async () => {
			// En producción, esto completaría el onboarding
			return { success: true };
		},
		onSuccess: () => {
			toast.success("¡Onboarding completado! Bienvenido a MarketingOS");
			router.push("/marketing-os");
		},
	});

	const handleNext = async () => {
		if (currentStep < STEPS.length) {
			await saveStepMutation.mutateAsync(currentStep);
			setCurrentStep(currentStep + 1);
		} else {
			await completeOnboardingMutation.mutateAsync();
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const progress = (currentStep / STEPS.length) * 100;

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<div className="flex items-center justify-between mb-4">
						<CardTitle className="text-2xl">Bienvenido a MarketingOS</CardTitle>
						<div className="text-sm text-muted-foreground">
							Paso {currentStep} de {STEPS.length}
						</div>
					</div>
					<Progress value={progress} className="mb-4" />
					<CardDescription>
						Configura tu cuenta en 5 pasos rápidos
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Paso 1: Info del Negocio */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Información de tu Negocio</h3>
							<div className="space-y-2">
								<Label htmlFor="businessName">Nombre del Negocio *</Label>
								<Input
									id="businessName"
									placeholder="Ej: Mi Empresa S.L."
									value={formData.businessName}
									onChange={(e) =>
										setFormData({ ...formData, businessName: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="businessType">Tipo de Negocio</Label>
								<Select
									value={formData.businessType}
									onValueChange={(value) =>
										setFormData({ ...formData, businessType: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ecommerce">E-commerce</SelectItem>
										<SelectItem value="saas">SaaS</SelectItem>
										<SelectItem value="agency">Agencia</SelectItem>
										<SelectItem value="consulting">Consultoría</SelectItem>
										<SelectItem value="other">Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="businessDescription">Descripción</Label>
								<Textarea
									id="businessDescription"
									placeholder="Describe brevemente tu negocio..."
									value={formData.businessDescription}
									onChange={(e) =>
										setFormData({ ...formData, businessDescription: e.target.value })
									}
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="targetAudience">Audiencia Objetivo</Label>
								<Input
									id="targetAudience"
									placeholder="Ej: Emprendedores de 25-40 años"
									value={formData.targetAudience}
									onChange={(e) =>
										setFormData({ ...formData, targetAudience: e.target.value })
									}
								/>
							</div>
						</div>
					)}

					{/* Paso 2: Redes Sociales */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Redes Sociales</h3>
							<p className="text-sm text-muted-foreground">
								Selecciona las redes sociales que quieres usar
							</p>
							<div className="space-y-2">
								{["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok", "YouTube"].map(
									(platform) => (
										<div key={platform} className="flex items-center space-x-2">
											<Checkbox
												id={platform}
												checked={formData.socialMedia.includes(platform)}
												onCheckedChange={(checked) => {
													if (checked) {
														setFormData({
															...formData,
															socialMedia: [...formData.socialMedia, platform],
														});
													} else {
														setFormData({
															...formData,
															socialMedia: formData.socialMedia.filter(
																(p) => p !== platform,
															),
														});
													}
												}}
											/>
											<Label htmlFor={platform} className="cursor-pointer">
												{platform}
											</Label>
										</div>
									),
								)}
							</div>
						</div>
					)}

					{/* Paso 3: Objetivos */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Objetivos de Marketing</h3>
							<div className="space-y-2">
								<Label htmlFor="primaryGoal">Objetivo Principal *</Label>
								<Select
									value={formData.primaryGoal}
									onValueChange={(value) =>
										setFormData({ ...formData, primaryGoal: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un objetivo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="awareness">Aumentar Conocimiento de Marca</SelectItem>
										<SelectItem value="leads">Generar Leads</SelectItem>
										<SelectItem value="sales">Aumentar Ventas</SelectItem>
										<SelectItem value="engagement">Mejorar Engagement</SelectItem>
										<SelectItem value="traffic">Aumentar Tráfico Web</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Objetivos Adicionales</Label>
								{[
									"Aumentar seguidores",
									"Mejorar SEO",
									"Generar contenido regular",
									"Automatizar publicaciones",
								].map((objective) => (
									<div key={objective} className="flex items-center space-x-2">
										<Checkbox
											id={objective}
											checked={formData.objectives.includes(objective)}
											onCheckedChange={(checked) => {
												if (checked) {
													setFormData({
														...formData,
														objectives: [...formData.objectives, objective],
													});
												} else {
													setFormData({
														...formData,
														objectives: formData.objectives.filter((o) => o !== objective),
													});
												}
											}}
										/>
										<Label htmlFor={objective} className="cursor-pointer">
											{objective}
										</Label>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Paso 4: Tono y Estilo */}
					{currentStep === 4 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Tono y Estilo</h3>
							<div className="space-y-2">
								<Label htmlFor="tone">Tono de Comunicación</Label>
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
										<SelectItem value="formal">Formal</SelectItem>
										<SelectItem value="humorous">Humorístico</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="brandVoice">Voz de Marca</Label>
								<Textarea
									id="brandVoice"
									placeholder="Describe cómo quieres que suene tu marca..."
									value={formData.brandVoice}
									onChange={(e) =>
										setFormData({ ...formData, brandVoice: e.target.value })
									}
									rows={4}
								/>
							</div>
						</div>
					)}

					{/* Paso 5: AutoPilot */}
					{currentStep === 5 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Activar AutoPilot</h3>
							<div className="p-4 border rounded-lg space-y-4">
								<div className="flex items-start space-x-3">
									<Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
									<div className="flex-1">
										<h4 className="font-semibold mb-1">AutoPilot de MarketingOS</h4>
										<p className="text-sm text-muted-foreground">
											AutoPilot genera y publica contenido automáticamente según tus
											preferencias. Puedes activarlo o desactivarlo en cualquier momento.
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="autoPilot"
										checked={formData.autoPilotEnabled}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, autoPilotEnabled: checked === true })
										}
									/>
									<Label htmlFor="autoPilot" className="cursor-pointer">
										Activar AutoPilot ahora
									</Label>
								</div>
							</div>
						</div>
					)}

					{/* Navegación */}
					<div className="flex justify-between pt-4">
						<Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Anterior
						</Button>
						<Button onClick={handleNext} disabled={currentStep === 1 && !formData.businessName}>
							{currentStep === STEPS.length ? (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Completar
								</>
							) : (
								<>
									Siguiente
									<ArrowRight className="ml-2 h-4 w-4" />
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

