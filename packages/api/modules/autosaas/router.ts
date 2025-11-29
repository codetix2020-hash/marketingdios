import { autosaasWebhookProcedure, sendFeatureRequestProcedure, processInboxProcedure } from './procedures/webhook'

export const autosaasRouter = {
  webhook: autosaasWebhookProcedure,
  featureRequest: sendFeatureRequestProcedure,
  processInbox: processInboxProcedure,
}

