export function getBaseUrl() {
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	// Railway support
	if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	}
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
