/**
 * MarketingOS - Modo Dios
 * Router oRPC para MarketingOS
 */

import { analyzeSeoUrl } from "./procedures/analyze-seo";
import { createAdCampaign } from "./procedures/create-ad-campaign";
import { generateContent } from "./procedures/generate-content";
import { getKpis } from "./procedures/get-kpis";
import { listContent } from "./procedures/list-content";
import { listLogs } from "./procedures/list-logs";

export const marketingRouter = {
	content: {
		generate: generateContent,
		list: listContent,
	},
	seo: {
		analyze: analyzeSeoUrl,
	},
	ads: {
		createCampaign: createAdCampaign,
	},
	kpis: {
		get: getKpis,
	},
	logs: {
		list: listLogs,
	},
};

