import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiRouterClient } from "@repo/api/orpc/router";
import { getBaseUrl } from "@repo/utils";

// Función helper para obtener URL desde headers en el servidor
async function getServerUrl(): Promise<string | null> {
	if (typeof window !== "undefined") {
		return null;
	}

	try {
		const { headers } = await import("next/headers");
		const headersList = await headers();
		const host = headersList.get("host");
		
		if (host) {
			const protocol = headersList.get("x-forwarded-proto") || 
				(process.env.NODE_ENV === "production" ? "https" : "http");
			return `${protocol}://${host}`;
		}
	} catch {
		// Ignorar errores
	}

	return null;
}

// Obtener URL base - intentar desde headers primero, luego getBaseUrl()
const baseUrlPromise = getServerUrl().then(serverUrl => serverUrl || getBaseUrl());

// Crear link con URL inicial (se actualizará dinámicamente en headers)
const link = new RPCLink({
	url: `${getBaseUrl()}/api/rpc`, // URL inicial
	headers: async () => {
		if (typeof window !== "undefined") {
			return {};
		}

		const { headers } = await import("next/headers");
		const headersList = await headers();
		const headersObj = Object.fromEntries(headersList);
		
		// Actualizar URL del link si tenemos host en headers
		const host = headersList.get("host");
		if (host) {
			const protocol = headersList.get("x-forwarded-proto") || 
				(process.env.NODE_ENV === "production" ? "https" : "http");
			const newUrl = `${protocol}://${host}/api/rpc`;
			// Actualizar URL del link dinámicamente
			if (link.url !== newUrl) {
				(link as any).url = newUrl;
			}
		}
		
		return headersObj;
	},
	interceptors: [
		onError((error) => {
			if (error instanceof Error && error.name === "AbortError") {
				return;
			}

			console.error(error);
		}),
	],
});

export const orpcClient: ApiRouterClient = createORPCClient(link);
