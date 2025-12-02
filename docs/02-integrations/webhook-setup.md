# Webhook Setup Guide

## Overview

This guide covers setting up webhooks for Plaid and Stripe integrations.

## Plaid Webhooks

### 1. Get Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/webhooks/plaid
```

### 2. Configure in Plaid Dashboard

1. Log in to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **Team Settings** → **Webhooks**
3. Add webhook URL for your environment:
   - **Development**: `https://your-dev-domain.com/api/webhooks/plaid`
   - **Production**: `https://your-prod-domain.com/api/webhooks/plaid`

### 3. Set Webhook Secret

1. In Plaid Dashboard, copy the webhook verification key
2. Set as environment variable:
   ```env
   PLAID_WEBHOOK_SECRET=your_webhook_verification_key
   ```

### 4. Test Webhook

Plaid provides a webhook testing tool in the dashboard. Use it to verify:
- Webhook endpoint is accessible
- Signature verification works
- Events are processed correctly

### 5. Webhook Events Handled

- `TRANSACTIONS.INITIAL_UPDATE` - Initial transaction sync
- `TRANSACTIONS.HISTORICAL_UPDATE` - Historical transaction sync
- `TRANSACTIONS.DEFAULT_UPDATE` - New transactions available
- `TRANSACTIONS.TRANSACTIONS_REMOVED` - Transactions removed
- `ITEM.ERROR` - Item connection error
- `ITEM.PENDING_EXPIRATION` - Access token expiring
- `ITEM.USER_PERMISSION_REVOKED` - User revoked access

## Stripe Webhooks

### 1. Get Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/webhooks/stripe
```

### 2. Configure in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter webhook URL
5. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Set Webhook Secret

1. After creating webhook, copy the **Signing secret**
2. Set as environment variable:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
   ```

### 4. Test Webhook

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

## Webhook Security

### Signature Verification

Both Plaid and Stripe webhooks use signature verification:

- **Plaid**: HMAC SHA-256
- **Stripe**: HMAC SHA-256

The webhook handlers automatically verify signatures. Invalid signatures return 401.

### Idempotency

Webhook handlers should be idempotent. The current implementation:
- Checks for duplicate events
- Handles retries gracefully
- Logs all webhook events

## Troubleshooting

### Webhook Not Receiving Events

1. Verify webhook URL is accessible (check SSL certificate)
2. Check webhook secret is correct
3. Verify webhook is enabled in provider dashboard
4. Check application logs for errors

### Signature Verification Failing

1. Verify webhook secret matches provider dashboard
2. Ensure raw request body is used (not parsed JSON)
3. Check for proxy/load balancer modifying requests

### Events Not Processing

1. Check Convex function logs
2. Verify database connections
3. Check for rate limiting
4. Review error logs

## Monitoring

Monitor webhook health:
- Check webhook delivery status in provider dashboards
- Monitor application logs for webhook errors
- Set up alerts for failed webhook deliveries
- Track webhook processing times
