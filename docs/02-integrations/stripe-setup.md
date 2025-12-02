# Stripe Billing Setup Guide

Complete guide for setting up Stripe billing and subscriptions in EZ Financial.

---

## Overview

EZ Financial uses Stripe for subscription billing with the following features:
- **Two subscription tiers**: Light and Pro plans
- **Billing periods**: Monthly and Annual (with 20% annual discount)
- **Free trial**: 14-day trial period for all plans
- **Webhook integration**: Real-time subscription status updates
- **Clerk integration**: User authentication with Stripe subscriptions

---

## Prerequisites

Before setting up Stripe, ensure you have:

- ✅ **Stripe Account**: Sign up at https://stripe.com (free to start)
- ✅ **Node.js 18+**: Required for Stripe SDK
- ✅ **Environment Variables**: Access to set environment variables
- ✅ **Stripe CLI** (optional): For local webhook testing
- ✅ **Deployed Application**: For production webhook endpoints

---

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Access the [Stripe Dashboard](https://dashboard.stripe.com)

### 1.2 Get API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

**Important**: Use test keys (`pk_test_`, `sk_test_`) for development. Switch to live keys (`pk_live_`, `sk_live_`) only in production.

---

## Step 2: Create Products and Prices

### 2.1 Pricing Structure

EZ Financial offers two subscription tiers:

#### Light Plan
- **Monthly**: $19.99/month
- **Annual**: $159.92/year ($13.33/month) - **Save 20%**
- **Trial**: 14 days free

#### Pro Plan
- **Monthly**: $29.99/month
- **Annual**: $239.92/year ($19.99/month) - **Save 20%**
- **Trial**: 14 days free

### 2.2 Create Products in Stripe Dashboard

1. Go to Stripe Dashboard → **Products**
2. Click **+ Add product**

#### Create Light Monthly Product

1. **Name**: `Light (Monthly)`
2. **Description**: `Light plan - Monthly billing`
3. **Pricing**:
   - **Price**: `$19.99`
   - **Billing period**: `Monthly`
   - **Recurring**: ✅ Yes
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_`) → Save as `STRIPE_PRICE_LIGHT_MONTHLY`

#### Create Light Annual Product

1. **Name**: `Light (Annual)`
2. **Description**: `Light plan - Annual billing (20% discount)`
3. **Pricing**:
   - **Price**: `$159.92` (or `$13.33` × 12 months)
   - **Billing period**: `Yearly`
   - **Recurring**: ✅ Yes
4. Click **Save product**
5. **Copy the Price ID** → Save as `STRIPE_PRICE_LIGHT_ANNUAL`

#### Create Pro Monthly Product

1. **Name**: `Pro (Monthly)`
2. **Description**: `Pro plan - Monthly billing`
3. **Pricing**:
   - **Price**: `$29.99`
   - **Billing period**: `Monthly`
   - **Recurring**: ✅ Yes
4. Click **Save product**
5. **Copy the Price ID** → Save as `STRIPE_PRICE_PRO_MONTHLY`

#### Create Pro Annual Product

1. **Name**: `Pro (Annual)`
2. **Description**: `Pro plan - Annual billing (20% discount)`
3. **Pricing**:
   - **Price**: `$239.92` (or `$19.99` × 12 months)
   - **Billing period**: `Yearly`
   - **Recurring**: ✅ Yes
4. Click **Save product**
5. **Copy the Price ID** → Save as `STRIPE_PRICE_PRO_ANNUAL`

**Note**: The 14-day trial period is set programmatically in the checkout session, not in the Stripe product settings.

---

## Step 3: Environment Variables

### 3.1 Frontend Environment Variables

Add to `apps/web/.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Step 2)
STRIPE_PRICE_LIGHT_MONTHLY=price_xxxxx
STRIPE_PRICE_LIGHT_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
```

### 3.2 Production Environment Variables

For production (Vercel, etc.), set these in your deployment platform:

- `STRIPE_SECRET_KEY` - Use live key (`sk_live_...`)
- `STRIPE_PUBLISHABLE_KEY` - Use live key (`pk_live_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Use live key (`pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` - Production webhook secret (see Step 4)
- All `STRIPE_PRICE_*` variables - Same price IDs (products work in both test and live)

**Important**: 
- Never commit `.env.local` to version control
- Use different keys for test and production
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for publishable keys)

---

## Step 4: Webhook Configuration

### 4.1 Production Webhook Setup

1. **Deploy your application** to production (e.g., Vercel)
2. **Get your webhook URL**:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
3. In Stripe Dashboard → **Developers** → **Webhooks**
4. Click **Add endpoint**
5. **Enter webhook URL**: Your production webhook URL
6. **Select events to listen for**:
   - `checkout.session.completed` - When checkout completes
   - `customer.subscription.created` - When subscription is created
   - `customer.subscription.updated` - When subscription is updated
   - `customer.subscription.deleted` - When subscription is cancelled
   - `invoice.payment_succeeded` - When payment succeeds
   - `invoice.payment_failed` - When payment fails
7. Click **Add endpoint**
8. **Copy the Signing secret** (starts with `whsec_`)
9. **Set as environment variable**: `STRIPE_WEBHOOK_SECRET`

### 4.2 Local Development Webhook Testing

For local development, use Stripe CLI to forward webhooks:

#### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Download from https://stripe.com/docs/stripe-cli

# Windows
# Download from https://stripe.com/docs/stripe-cli
```

#### Login to Stripe CLI

```bash
stripe login
```

This opens your browser to authorize the CLI.

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Forward all webhook events to your local server
- Display a **webhook signing secret** (starts with `whsec_`)
- Keep running until you stop it (Ctrl+C)

**Use this signing secret** for `STRIPE_WEBHOOK_SECRET` in local development.

#### Trigger Test Events

In a separate terminal:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed
```

---

## Step 5: Application Integration

### 5.1 Stripe Provider Setup

The application uses a `StripeProvider` component to wrap the app with Stripe Elements:

**File**: `apps/web/app/components/StripeProvider.tsx`

This provider:
- Initializes Stripe with the publishable key
- Wraps the app with Stripe Elements context
- Gracefully handles missing Stripe keys (disables Stripe features)

### 5.2 Checkout API

**File**: `apps/web/app/api/checkout/route.ts`

This API route:
- Creates Stripe checkout sessions
- Handles monthly and annual billing
- Sets 14-day trial period
- Stores user metadata for webhook processing

**Usage**:
```typescript
POST /api/checkout
{
  "plan": "light" | "pro",
  "billingPeriod": "monthly" | "annual"
}
```

### 5.3 Webhook Handler

**File**: `apps/web/app/api/webhooks/stripe/route.ts`

This webhook handler processes Stripe events:
- Verifies webhook signatures
- Updates subscription status in Convex
- Handles all subscription lifecycle events

**Events Handled**:
- `checkout.session.completed` - Starts trial
- `customer.subscription.created` - Creates subscription
- `customer.subscription.updated` - Updates subscription
- `customer.subscription.deleted` - Cancels subscription
- `invoice.payment_succeeded` - Activates subscription
- `invoice.payment_failed` - Marks as past_due

### 5.4 Subscription Management (Convex)

**File**: `convex/subscriptions.ts`

Backend functions for subscription management:
- `getSubscriptionStatus` - Get user's current tier
- `updateSubscription` - Update subscription (called from webhooks)
- `isInTrial` - Check if user is in trial period

---

## Step 6: User Flow

### 6.1 Subscription Flow

1. **User visits `/pricing`** → Sees Light and Pro plans
2. **Selects billing period** → Monthly or Annual (with 20% discount)
3. **Clicks "Start 14-Day Free Trial"** → Redirected to Stripe checkout
4. **Completes checkout** → Stripe creates subscription with 14-day trial
5. **Webhook receives event** → Updates user subscription in Convex
6. **User redirected to dashboard** → Shows subscription status

### 6.2 Subscription States

- **`trial`** - User is in 14-day free trial
- **`active`** - Subscription is active and paid
- **`past_due`** - Payment failed, subscription is past due
- **`cancelled`** - Subscription has been cancelled

---

## Step 7: Testing

### 7.1 Test Cards

Stripe provides test cards for testing:

#### Success Cards
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

#### Decline Cards
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

**Use any future expiry date and any CVC** (e.g., `12/34` and `123`)

### 7.2 Test Flow

1. **Start local development server**:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Start Stripe CLI webhook forwarding** (in separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Visit pricing page**: http://localhost:3000/pricing

4. **Select plan and billing period**

5. **Click "Start 14-Day Free Trial"**

6. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

7. **Complete checkout**

8. **Verify**:
   - Webhook receives event (check Stripe CLI output)
   - User subscription updated in Convex
   - User redirected to dashboard
   - Subscription status displayed correctly

### 7.3 Test Different Scenarios

#### Test Payment Failure
1. Use decline card: `4000 0000 0000 0002`
2. Verify subscription status is `past_due`

#### Test Subscription Cancellation
1. In Stripe Dashboard → **Customers** → Select customer
2. Click **Cancel subscription**
3. Verify webhook receives `customer.subscription.deleted`
4. Verify user downgraded to `solo` tier

#### Test Trial Period
1. Complete checkout with test card
2. Verify subscription status is `trial`
3. Wait 14 days (or use Stripe test clock to advance time)
4. Verify subscription transitions to `active` after trial

---

## Step 8: Troubleshooting

### 8.1 Common Issues

#### "STRIPE_SECRET_KEY is not set"
**Solution**: 
- Verify environment variable is set in `.env.local`
- Restart development server after adding env variables
- Check variable name is exactly `STRIPE_SECRET_KEY`

#### Webhook Not Receiving Events
**Solution**:
1. Verify webhook URL is accessible (check SSL certificate)
2. Check webhook secret matches Stripe dashboard
3. Verify webhook is enabled in Stripe dashboard
4. Check application logs for errors
5. For local: Ensure Stripe CLI is running and forwarding

#### Signature Verification Failing
**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Ensure raw request body is used (not parsed JSON)
3. Check for proxy/load balancer modifying requests
4. Verify webhook secret is for correct environment (test vs live)

#### Checkout Session Not Creating
**Solution**:
1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check Price IDs are valid (from Stripe dashboard)
3. Verify user is authenticated (Clerk)
4. Check API route logs for errors

#### Subscription Not Updating in Convex
**Solution**:
1. Verify webhook is receiving events (check Stripe dashboard)
2. Check Convex function logs for errors
3. Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly
4. Check webhook handler logs for errors

### 8.2 Debugging Tips

#### Check Webhook Delivery Status
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Recent events** to see delivery status
4. Click on an event to see request/response details

#### Enable Webhook Logging
The webhook handler logs all events. Check your application logs:
```bash
# Next.js logs
# Check terminal where `pnpm dev` is running

# Vercel logs
vercel logs
```

#### Test Webhook Locally
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

#### Verify Environment Variables
```bash
# Check if variables are loaded
node -e "console.log(process.env.STRIPE_SECRET_KEY)"
```

**Note**: This only works in Node.js context, not in browser.

---

## Step 9: Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (`sk_live_`, `pk_live_`)
- [ ] Create production webhook endpoint
- [ ] Set production webhook secret
- [ ] Test checkout flow with real card (small amount)
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation flow
- [ ] Test payment failure handling
- [ ] Set up monitoring/alerts for webhook failures
- [ ] Review Stripe dashboard for any warnings
- [ ] Test all subscription tiers (Light/Pro, Monthly/Annual)

---

## Related Documentation

- [Webhook Setup Guide](../webhook-setup.md) - General webhook configuration
- [Deployment Guide](../deployment-guide.md) - Production deployment
- [Installation Guide](../01-getting-started/installation.md) - Initial setup
- [Subscription Setup Complete](../06-status-reports/SUBSCRIPTION_SETUP_COMPLETE.md) - Implementation details

---

## Stripe Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

**Last Updated**: December 2024  
**Stripe API Version**: 2025-11-17.clover
