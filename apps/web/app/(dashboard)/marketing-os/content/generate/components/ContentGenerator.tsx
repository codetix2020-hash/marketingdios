/**
 * MarketingOS - Modo Dios
 * Componente de generación de contenido
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Sparkles, Loader2, Eye, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContentGeneratorProps {
	organizationId: string;
}

export function ContentGenerator({ organizationId }: ContentGeneratorProps) {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState({
		type: "POST" as "EMAIL" | "POST" | "REEL" | "BLOG",
		topic: "",
		tone: "professional",
		targetAudience: "",
		length: "medium" as "short" | "medium" | "long",
		keywords: "",
	});
	const [preview, setPreview] = useState<any>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const generateMutation = useMutation(
		orpc.marketing.content.generate.mutationOptions(),
	);

	const { data: contentList } = useQuery(
		orpc.marketing.content.list.queryOptions({
			input: {
				organizationId,
				type: formData.type,
				limit: 10,
			},
		}),
	);

	const handleGenerate = async () => {
		if (!formData.topic.trim()) {
			toast.error("Por favor, ingresa un tema");
			return;
		}

		setIsGenerating(true);
		setPreview(null);

		try {
			const result = await generateMutation.mutateAsync({
				organizationId,
				type: formData.type,
				topic: formData.topic,
				tone: formData.tone || undefined,
				targetAudience: formData.targetAudience || undefined,
				length: formData.length,
				keywords: formData.keywords
					.split(",")
					.map((k) => k.trim())
					.filter((k) => k.length > 0),
			});

			if (result.content) {
				setPreview(result.content);
				toast.success("¡Contenido generado exitosamente!");
				queryClient.invalidateQueries({
					queryKey: orpc.marketing.content.list.queryKey({
						input: { organizationId },
					}),
				});
			}
		} catch (error) {
			toast.error("Error al generar contenido. Intenta nuevamente.");
			console.error(error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handlePublish = async () => {
		if (!preview) return;

		toast.info("Funcionalidad de publicación en desarrollo");
		// Aquí se implementaría la lógica de publicación
	};

	return (
		<div className="space-y-6">
			<Tabs defaultValue="generate" className="space-y-4">
				<TabsList>
					<TabsTrigger value="generate">Generar</TabsTrigger>
					<TabsTrigger value="history">Historial</TabsTrigger>
				</TabsList>

				<TabsContent value="generate" className="space-y-4">
					<div className="grid gap-6 md:grid-cols-2">
						{/* Formulario */}
						<Card>
							<CardHeader>
								<CardTitle>Configuración</CardTitle>
								<CardDescription>
									Configura los parámetros para generar tu contenido
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="type">Tipo de Contenido</Label>
									<Select
										value={formData.type}
										onValueChange={(value: any) =>
											setFormData({ ...formData, type: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="EMAIL">Email</SelectItem>
											<SelectItem value="POST">Post de Redes</SelectItem>
											<SelectItem value="REEL">Reel</SelectItem>
											<SelectItem value="BLOG">Artículo de Blog</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="topic">Tema *</Label>
									<Input
										id="topic"
										placeholder="Ej: Lanzamiento de nuevo producto"
										value={formData.topic}
										onChange={(e) =>
											setFormData({ ...formData, topic: e.target.value })
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="tone">Tono</Label>
									<Select
										value={formData.tone}
										onValueChange={(value) =>
											setFormData({ ...formData, tone: value })
										}
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

								<div className="space-y-2">
									<Label htmlFor="length">Longitud</Label>
									<Select
										value={formData.length}
										onValueChange={(value: any) =>
											setFormData({ ...formData, length: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="short">Corto</SelectItem>
											<SelectItem value="medium">Medio</SelectItem>
											<SelectItem value="long">Largo</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="keywords">Keywords (separadas por comas)</Label>
									<Input
										id="keywords"
										placeholder="marketing, digital, estrategia"
										value={formData.keywords}
										onChange={(e) =>
											setFormData({ ...formData, keywords: e.target.value })
										}
									/>
								</div>

								<Button
									onClick={handleGenerate}
									disabled={isGenerating || !formData.topic.trim()}
									className="w-full"
								>
									{isGenerating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Generando...
										</>
									) : (
										<>
											<Sparkles className="mr-2 h-4 w-4" />
											Generar con IA
										</>
									)}
								</Button>
							</CardContent>
						</Card>

						{/* Vista previa */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Eye className="h-5 w-5" />
									Vista Previa
								</CardTitle>
								<CardDescription>
									Revisa el contenido generado antes de guardarlo
								</CardDescription>
							</CardHeader>
							<CardContent>
								{preview ? (
									<div className="space-y-4">
										<div>
											<h3 className="font-semibold text-lg mb-2">
												{preview.title || "Sin título"}
											</h3>
											<div className="prose prose-sm max-w-none">
												<pre className="whitespace-pre-wrap text-sm">
													{preview.content}
												</pre>
											</div>
										</div>

										{preview.metadata && (
											<div className="text-xs text-muted-foreground space-y-1">
												<p>Palabras: {preview.metadata.wordCount || 0}</p>
												{preview.metadata.keywords && (
													<p>
														Keywords: {preview.metadata.keywords.join(", ")}
													</p>
												)}
											</div>
										)}

										<div className="flex gap-2">
											<Button onClick={handlePublish} variant="primary">
												<Send className="mr-2 h-4 w-4" />
												Publicar Ahora
											</Button>
											<Button
												variant="outline"
												onClick={() => {
													toast.success("Contenido guardado");
													setPreview(null);
												}}
											>
												Guardar
											</Button>
										</div>
									</div>
								) : (
									<div className="text-center py-12 text-muted-foreground">
										<p>El contenido generado aparecerá aquí</p>
										<p className="text-xs mt-2">
											Completa el formulario y haz clic en "Generar con IA"
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="history">
					<Card>
						<CardHeader>
							<CardTitle>Historial de Contenido</CardTitle>
							<CardDescription>
								Contenido generado anteriormente
							</CardDescription>
						</CardHeader>
						<CardContent>
							{contentList?.content && contentList.content.length > 0 ? (
								<div className="space-y-4">
									{contentList.content.map((item: any) => (
										<div
											key={item.id}
											className="p-4 border rounded-lg space-y-2"
										>
											<div className="flex items-center justify-between">
												<h4 className="font-semibold">{item.title || "Sin título"}</h4>
												<span className="text-xs text-muted-foreground">
													{item.type}
												</span>
											</div>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{item.content}
											</p>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<span>{new Date(item.createdAt).toLocaleDateString("es-ES")}</span>
												<span>•</span>
												<span>{item.status}</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									No hay contenido generado aún
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

