import { task } from "@trigger.dev/sdk/v3";
import {
	orchestrate,
	getRecentMetrics,
	getPendingTasks,
} from "../../src/lib/ai/marketing/orchestrator";

export const orchestrationCycle = task({
	id: "marketing-orchestration-cycle",
	run: async (payload: { organizationId: string }) => {
		const context = {
			organizationId: payload.organizationId,
			recentMetrics: await getRecentMetrics(payload.organizationId),
			pendingTasks: await getPendingTasks(payload.organizationId),
		};

		const decision = await orchestrate(context);

		// TODO: Ejecutar decisiones
		// for (const content of decision.contentPlan) {
		//   await trigger('generate-content', content)
		// }

		// for (const action of decision.campaignActions) {
		//   await trigger('campaign-action', action)
		// }

		return { success: true, decision };
	},
});

