/**
 * MarketingOS - Modo Dios
 * Componente de análisis SEO
 */

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Badge } from "@ui/components/badge";
import { Search, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SEOAnalyzerProps {
	organizationId: string;
}

export function SEOAnalyzer({ organizationId }: SEOAnalyzerProps) {
	const [url, setUrl] = useState("");
	const [content, setContent] = useState("");
	const [title, setTitle] = useState("");
	const [metaDescription, setMetaDescription] = useState("");
	const [keywords, setKeywords] = useState("");
	const [analysis, setAnalysis] = useState<any>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	const analyzeMutation = useMutation(
		orpc.marketing.seo.analyze.mutationOptions(),
	);

	const handleAnalyze = async () => {
		if (!url.trim()) {
			toast.error("Por favor, ingresa una URL");
			return;
		}

		setIsAnalyzing(true);
		setAnalysis(null);

		try {
			const result = await analyzeMutation.mutateAsync({
				organizationId,
				url,
				content: content || undefined,
				title: title || undefined,
				metaDescription: metaDescription || undefined,
				keywords: keywords
					.split(",")
					.map((k) => k.trim())
					.filter((k) => k.length > 0),
			});

			if (result.seo && result.analysis) {
				setAnalysis(result);
				toast.success("Análisis SEO completado");
			}
		} catch (error) {
			toast.error("Error al analizar SEO. Intenta nuevamente.");
			console.error(error);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	const getScoreBadge = (score: number) => {
		if (score >= 80) return "bg-green-500/10 text-green-500";
		if (score >= 60) return "bg-yellow-500/10 text-yellow-500";
		return "bg-red-500/10 text-red-500";
	};

	return (
		<div className="space-y-6">
			<Tabs defaultValue="analyze" className="space-y-4">
				<TabsList>
					<TabsTrigger value="analyze">Analizar</TabsTrigger>
					<TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
				</TabsList>

				<TabsContent value="analyze" className="space-y-4">
					<div className="grid gap-6 md:grid-cols-2">
						{/* Formulario */}
						<Card>
							<CardHeader>
								<CardTitle>Configuración del Análisis</CardTitle>
								<CardDescription>
									Ingresa la URL y opcionalmente el contenido para analizar
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="url">URL *</Label>
									<Input
										id="url"
										type="url"
										placeholder="https://example.com/page"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="title">Título (opcional)</Label>
									<Input
										id="title"
										placeholder="Título de la página"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="metaDescription">Meta Description (opcional)</Label>
									<Textarea
										id="metaDescription"
										placeholder="Descripción meta de la página"
										value={metaDescription}
										onChange={(e) => setMetaDescription(e.target.value)}
										rows={3}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="keywords">Keywords (separadas por comas)</Label>
									<Input
										id="keywords"
										placeholder="keyword1, keyword2, keyword3"
										value={keywords}
										onChange={(e) => setKeywords(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="content">Contenido (opcional)</Label>
									<Textarea
										id="content"
										placeholder="Pega aquí el contenido HTML o texto de la página"
										value={content}
										onChange={(e) => setContent(e.target.value)}
										rows={6}
									/>
								</div>

								<Button
									onClick={handleAnalyze}
									disabled={isAnalyzing || !url.trim()}
									className="w-full"
								>
									{isAnalyzing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Analizando...
										</>
									) : (
										<>
											<Search className="mr-2 h-4 w-4" />
											Analizar SEO
										</>
									)}
								</Button>
							</CardContent>
						</Card>

						{/* Resultados */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									Resultados del Análisis
								</CardTitle>
								<CardDescription>
									Score SEO y análisis detallado
								</CardDescription>
							</CardHeader>
							<CardContent>
								{analysis ? (
									<div className="space-y-6">
										{/* Score general */}
										<div className="text-center space-y-2">
											<div className={`text-6xl font-bold ${getScoreColor(analysis.seo.score)}`}>
												{analysis.seo.score}
											</div>
											<Badge className={getScoreBadge(analysis.seo.score)}>
												{analysis.seo.score >= 80
													? "Excelente"
													: analysis.seo.score >= 60
														? "Bueno"
														: "Necesita Mejora"}
											</Badge>
										</div>

										{/* Análisis por categoría */}
										<div className="space-y-4">
											{analysis.analysis && (
												<>
													{/* Título */}
													<div className="space-y-2">
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium">Título</span>
														<Badge
															className={
																	analysis.analysis.title.score >= 80
																		? "border-green-500 text-green-500"
																		: analysis.analysis.title.score >= 60
																			? "border-yellow-500 text-yellow-500"
																			: "border-red-500 text-red-500"
																}
															>
																{analysis.analysis.title.score}/100
															</Badge>
														</div>
														{analysis.analysis.title.recommendations.length > 0 && (
															<ul className="text-xs text-muted-foreground space-y-1">
																{analysis.analysis.title.recommendations.map(
																	(rec: string, i: number) => (
																		<li key={i}>• {rec}</li>
																	),
																)}
															</ul>
														)}
													</div>

													{/* Meta Description */}
													<div className="space-y-2">
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium">
																Meta Description
															</span>
														<Badge
															className={
																	analysis.analysis.metaDescription.score >= 80
																		? "border-green-500 text-green-500"
																		: analysis.analysis.metaDescription.score >= 60
																			? "border-yellow-500 text-yellow-500"
																			: "border-red-500 text-red-500"
																}
															>
																{analysis.analysis.metaDescription.score}/100
															</Badge>
														</div>
														{analysis.analysis.metaDescription.recommendations.length >
															0 && (
															<ul className="text-xs text-muted-foreground space-y-1">
																{analysis.analysis.metaDescription.recommendations.map(
																	(rec: string, i: number) => (
																		<li key={i}>• {rec}</li>
																	),
																)}
															</ul>
														)}
													</div>

													{/* Contenido */}
													<div className="space-y-2">
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium">Contenido</span>
														<Badge
															className={
																	analysis.analysis.content.score >= 80
																		? "border-green-500 text-green-500"
																		: analysis.analysis.content.score >= 60
																			? "border-yellow-500 text-yellow-500"
																			: "border-red-500 text-red-500"
																}
															>
																{analysis.analysis.content.score}/100
															</Badge>
														</div>
														<div className="text-xs text-muted-foreground">
															<p>
																Palabras: {analysis.analysis.content.wordCount || 0}
															</p>
															<p>
																Legibilidad:{" "}
																{analysis.analysis.content.readability || 0}/100
															</p>
														</div>
													</div>
												</>
											)}
										</div>
									</div>
								) : (
									<div className="text-center py-12 text-muted-foreground">
										<p>Los resultados del análisis aparecerán aquí</p>
										<p className="text-xs mt-2">
											Completa el formulario y haz clic en "Analizar SEO"
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="recommendations">
					<Card>
						<CardHeader>
							<CardTitle>Recomendaciones</CardTitle>
							<CardDescription>
								Acciones sugeridas para mejorar el SEO
							</CardDescription>
						</CardHeader>
						<CardContent>
							{analysis && analysis.recommendations ? (
								<div className="space-y-4">
									{analysis.recommendations.map((rec: string, i: number) => (
										<div
											key={i}
											className="flex items-start gap-3 p-4 border rounded-lg"
										>
											<AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
											<p className="text-sm">{rec}</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									Realiza un análisis primero para ver las recomendaciones
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

