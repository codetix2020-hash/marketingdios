import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
	description: "Sistema de marketing autónomo 24/7 para CodeTix. Tu departamento de marketing completo en piloto automático.",
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
