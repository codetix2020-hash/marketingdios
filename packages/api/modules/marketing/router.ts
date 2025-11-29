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
import { orchestrateProcedure } from "./procedures/orchestrate";
import { saveMemoryProcedure } from "./procedures/save-memory";
import { searchMemoryProcedure } from "./procedures/search-memory";
import { seedMemoryProcedure } from "./procedures/seed-memory";
import { triggerOrchestrationProcedure } from "./procedures/trigger-orchestration";
import { godModeStatsProcedure } from "./procedures/god-mode-stats";
import { processJobProcedure } from "./procedures/process-job";
import { generateImageProcedure, generateImageVariantsProcedure } from "./procedures/generate-image";
import { generateEmailSequenceProcedure, sendEmailProcedure } from "./procedures/email";

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
	brain: {
		orchestrate: orchestrateProcedure,
		saveMemory: saveMemoryProcedure,
		searchMemory: searchMemoryProcedure,
		seedMemory: seedMemoryProcedure,
		triggerOrchestration: triggerOrchestrationProcedure,
	},
	godMode: {
		getStats: godModeStatsProcedure,
	},
	jobs: {
		process: processJobProcedure,
	},
	visual: {
		generate: generateImageProcedure,
		variants: generateImageVariantsProcedure,
	},
	email: {
		generateSequence: generateEmailSequenceProcedure,
		send: sendEmailProcedure,
	},
};

