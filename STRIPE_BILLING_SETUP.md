# Stripe Billing & Subscription Setup Guide

## Overview

This guide explains how to set up subscriptions and payments using **Stripe** (integrated with Clerk for authentication) with:
- **Light Plan**: $19.99/month or $159.92/year (20% discount)
- **Pro Plan**: $29.99/month or $239.92/year (20% discount)
- **14-day free trial** for both plans
- **Annual billing** with 20% discount

## Step 1: Set Up Stripe Account

1. Sign up at https://dashboard.stripe.com
2. Get your API keys from **Developers** → **API keys**
3. Copy your **Secret Key** and **Publishable Key**

## Step 2: Create Products in Stripe

### Light Plan - Monthly
1. Go to **Products** → **Add Product**
2. **Name**: Light (Monthly)
3. **Pricing**: $19.99/month
4. **Billing**: Recurring, Monthly
5. **Trial period**: 14 days
6. Copy the **Price ID** (starts with `price_`)

### Light Plan - Annual
1. **Name**: Light (Annual)
2. **Pricing**: $159.92/year (or set as $13.33/month × 12)
3. **Billing**: Recurring, Yearly
4. **Trial period**: 14 days
5. Copy the **Price ID**

### Pro Plan - Monthly
1. **Name**: Pro (Monthly)
2. **Pricing**: $29.99/month
3. **Billing**: Recurring, Monthly
4. **Trial period**: 14 days
5. Copy the **Price ID**

### Pro Plan - Annual
1. **Name**: Pro (Annual)
2. **Pricing**: $239.92/year (or set as $19.99/month × 12)
3. **Billing**: Recurring, Yearly
4. **Trial period**: 14 days
5. Copy the **Price ID**

## Step 3: Configure Environment Variables

Add to `apps/web/.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Step 2)
STRIPE_PRICE_LIGHT_MONTHLY=price_xxxxx
STRIPE_PRICE_LIGHT_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
```

## Step 4: Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Local Development

Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret for local testing.

## Step 5: Update Price IDs in Code

Update `apps/web/app/api/checkout/route.ts` with your actual price IDs, or they'll be loaded from environment variables.

## Step 6: Test the Flow

1. **Test Checkout**:
   - Visit `/pricing`
   - Select a plan and billing period
   - Click "Start 14-Day Free Trial"
   - Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
   - Verify webhook receives event

2. **Test Trial Period**:
   - Sign up and subscribe
   - Verify subscription status is "trial"
   - Check trial end date is 14 days from now

3. **Test Annual Discount**:
   - Select annual billing
   - Verify price shows 20% discount
   - Complete checkout and verify billing amount

## Pricing Details

### Light Plan
- **Monthly**: $19.99/month
- **Annual**: $159.92/year ($13.33/month) - **Save 20%**
- **Trial**: 14 days free

### Pro Plan
- **Monthly**: $29.99/month
- **Annual**: $239.92/year ($19.99/month) - **Save 20%**
- **Trial**: 14 days free

## Webhook Events Handled

- **checkout.session.completed**: User completed checkout → Start trial
- **customer.subscription.created**: New subscription → Set trial status
- **customer.subscription.updated**: Subscription changed → Update tier/status
- **customer.subscription.deleted**: Subscription cancelled → Downgrade to free
- **invoice.payment_succeeded**: Payment successful → Activate subscription
- **invoice.payment_failed**: Payment failed → Mark as past_due

## Files Created

**Created:**
- `apps/web/app/pricing/page.tsx` - Pricing page with subscription options
- `apps/web/app/api/checkout/route.ts` - Creates Stripe checkout sessions
- `apps/web/app/api/webhooks/stripe/route.ts` - Handles Stripe webhook events
- `convex/subscriptions.ts` - Subscription management functions

**Modified:**
- `convex/schema.ts` - Updated subscription tiers (solo, light, pro)
- `apps/web/app/page.tsx` - Updated landing page pricing section

## Testing with Stripe Test Mode

Use Stripe's test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## Next Steps

1. ✅ Set up products in Stripe dashboard
2. ✅ Configure webhook endpoint
3. ✅ Add environment variables
4. ⏭️ Test checkout flow
5. ⏭️ Add subscription management page (`/settings/billing`)
6. ⏭️ Handle subscription upgrades/downgrades
7. ⏭️ Add cancellation flow
8. ⏭️ Add billing history page

## Stripe Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Webhooks: https://stripe.com/docs/webhooks

