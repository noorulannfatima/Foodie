import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  initiateSafepayPayment,
  verifySafepayPayment,
  safepayWebhook,
  confirmCashOnDelivery,
} from '../controllers/payment.controller';

/**
 * Payment routes — split into two routers because the webhook needs the raw
 * request body (for signature verification) while everything else is JSON.
 *
 * The customer-facing endpoints sit under /api/payments and are protected
 * by authMiddleware. The webhook is unauthenticated but signature-verified.
 */

// ---- Authenticated customer router ---------------------------------------

const router = Router();
router.use(authMiddleware);

// Safepay
router.post('/safepay/initiate', initiateSafepayPayment);
router.get('/safepay/verify/:orderId', verifySafepayPayment);

// Cash on Delivery
router.post('/cod/confirm', confirmCashOnDelivery);

// ---- Webhook router (raw body, no auth) ----------------------------------

export const webhookRouter = Router();

// Safepay signs the *exact* bytes of the request body — using express.json()
// here would re-serialise and break the signature, so we install raw parser
// scoped to this route only.
webhookRouter.post(
  '/safepay/webhook',
  express.raw({ type: '*/*' }),
  safepayWebhook,
);

export default router;
