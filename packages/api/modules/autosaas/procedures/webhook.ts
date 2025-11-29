import { publicProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { handleNewProduct, sendFeatureRequest, processInbox } from '../webhook-handler'

export const autosaasWebhookProcedure = publicProcedure
  .route({
    method: 'POST',
    path: '/autosaas/webhook',
    tags: ['Auto-SaaS', 'Webhooks'],
    summary: 'Webhook handler for Auto-SaaS Builder',
    description: 'Handles webhooks from Auto-SaaS Builder to MarketingOS',
  })
  .input(
    z.object({
      type: z.enum(['new_product', 'product_update', 'feature_deployed']),
      payload: z.any(),
      signature: z.string().optional(), // Para verificar autenticidad
    })
  )
  .handler(async ({ input }) => {
    // TODO: Verificar signature
    // if (!verifySignature(input.signature, input.payload)) {
    //   throw new Error('Invalid signature')
    // }

    if (input.type === 'new_product') {
      const result = await handleNewProduct(input.payload)
      return {
        status: 200,
        body: {
          success: true,
          result,
        },
      }
    }

    if (input.type === 'product_update') {
      // TODO: Implementar actualización de producto
      return {
        status: 200,
        body: {
          success: true,
          message: 'Product update processed',
        },
      }
    }

    if (input.type === 'feature_deployed') {
      // TODO: Procesar feature desplegado
      return {
        status: 200,
        body: {
          success: true,
          message: 'Feature deployed notification processed',
        },
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Webhook processed',
      },
    }
  })

export const sendFeatureRequestProcedure = publicProcedure
  .route({
    method: 'POST',
    path: '/autosaas/feature-request',
    tags: ['Auto-SaaS', 'Webhooks'],
    summary: 'Send feature request to Auto-SaaS Builder',
    description: 'MarketingOS sends feature requests to Auto-SaaS Builder',
  })
  .input(
    z.object({
      productId: z.string(),
      featureTitle: z.string(),
      featureDescription: z.string(),
      userDemand: z.number().min(1).max(10),
      marketOpportunity: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const result = await sendFeatureRequest(input)
    return {
      status: 200,
      body: {
        success: true,
        request: result,
      },
    }
  })

export const processInboxProcedure = publicProcedure
  .route({
    method: 'POST',
    path: '/autosaas/process-inbox',
    tags: ['Auto-SaaS', 'Webhooks'],
    summary: 'Process pending inbox items',
    description: 'Process pending requests from Auto-SaaS Builder',
  })
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const result = await processInbox(input.organizationId)
    return {
      status: 200,
      body: {
        success: true,
        result,
      },
    }
  })

