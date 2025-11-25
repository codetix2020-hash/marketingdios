/**
 * MarketingOS - Modo Dios
 * Router oRPC para MarketingOS
 */

import { analyzeSeoUrl } from "./procedures/analyze-seo";
import { connectSocialAccount } from "./procedures/connect-social-account";
import { createAdCampaign } from "./procedures/create-ad-campaign";
import { generateContent } from "./procedures/generate-content";
import { getKpis } from "./procedures/get-kpis";
import { listCampaigns } from "./procedures/list-campaigns";
import { listContent } from "./procedures/list-content";
import { listLogs } from "./procedures/list-logs";
import { listScheduledPosts } from "./procedures/list-scheduled-posts";
import { listSocialAccounts } from "./procedures/list-social-accounts";
import { schedulePost } from "./procedures/schedule-post";

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
		listCampaigns: listCampaigns,
	},
	social: {
		schedule: schedulePost,
		listScheduled: listScheduledPosts,
		connectAccount: connectSocialAccount,
		listAccounts: listSocialAccounts,
	},
	kpis: {
		get: getKpis,
	},
	logs: {
		list: listLogs,
	},
};

