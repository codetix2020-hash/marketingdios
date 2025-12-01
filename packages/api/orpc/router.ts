import type { RouterClient } from "@orpc/server";
import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { autosaasRouter } from "../modules/autosaas/router";
import { contactRouter } from "../modules/contact/router";
import { financeRouter } from "../modules/finance/router";
import { marketingRouter } from "../modules/marketing/router";
import { newsletterRouter } from "../modules/newsletter/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	newsletter: newsletterRouter,
	contact: contactRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	marketing: marketingRouter,
	autosaas: autosaasRouter,
	finance: financeRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;
