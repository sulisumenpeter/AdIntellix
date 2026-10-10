# Billing

Paddle is the ONLY billing provider. Stripe must not exist anywhere.

## Subscription Lifecycle
- Customer creation & Checkout via Paddle.
- Monthly & Annual billing.
- Trials (if implemented).
- Upgrades, Downgrades, Renewals, Failed payments, Cancellations, Refunds.

## Webhooks
- Webhook verification is required.
- Webhook idempotency is required.
- Entitlement enforcement via Database.

## Required Subscription States
`trialing`, `active`, `past_due`, `paused`, `canceled`, `expired`.

Never trust billing state supplied by the frontend.
