# Subscription & Billing Setup Complete ✅

## What's Been Built

### 1. Pricing Page (`apps/web/app/pricing/page.tsx`)
✅ **Complete pricing page** with:
- Light and Pro plan options
- Monthly/Annual billing toggle
- 20% annual discount display
- 14-day free trial messaging
- Stripe checkout integration
- Loading and error states

### 2. Stripe Checkout API (`apps/web/app/api/checkout/route.ts`)
✅ **Checkout session creation**:
- Creates Stripe checkout sessions
- Handles monthly and annual billing
- Sets 14-day trial period
- Stores user metadata for webhook processing

### 3. Stripe Webhook Handler (`apps/web/app/api/webhooks/stripe/route.ts`)
✅ **Webhook event processing**:
- `checkout.session.completed` - Starts trial
- `customer.subscription.created` - Creates subscription
- `customer.subscription.updated` - Updates subscription
- `customer.subscription.deleted` - Cancels subscription
- `invoice.payment_succeeded` - Activates subscription
- `invoice.payment_failed` - Marks as past_due

### 4. Subscription Management (`convex/subscriptions.ts`)
✅ **Backend functions**:
- `getSubscriptionStatus` - Get user's current tier
- `updateSubscription` - Update subscription (called from webhooks)
- `isInTrial` - Check if user is in trial period

### 5. Schema Updates (`convex/schema.ts`)
✅ **Updated subscription tiers**:
- Changed from: `solo`, `professional`, `growing_business`
- Changed to: `solo`, `light`, `pro`

## Pricing Structure

### Light Plan
- **Monthly**: $19.99/month
- **Annual**: $159.92/year ($13.33/month) - **Save 20%**
- **Trial**: 14 days free

### Pro Plan
- **Monthly**: $29.99/month
- **Annual**: $239.92/year ($19.99/month) - **Save 20%**
- **Trial**: 14 days free

## Setup Required

### 1. Create Products in Stripe

1. Go to https://dashboard.stripe.com
2. Create 4 products:

**Light Monthly:**
- Name: Light (Monthly)
- Price: $19.99/month
- Trial: 14 days
- Copy Price ID → `STRIPE_PRICE_LIGHT_MONTHLY`

**Light Annual:**
- Name: Light (Annual)
- Price: $159.92/year (or $13.33/month × 12)
- Trial: 14 days
- Copy Price ID → `STRIPE_PRICE_LIGHT_ANNUAL`

**Pro Monthly:**
- Name: Pro (Monthly)
- Price: $29.99/month
- Trial: 14 days
- Copy Price ID → `STRIPE_PRICE_PRO_MONTHLY`

**Pro Annual:**
- Name: Pro (Annual)
- Price: $239.92/year (or $19.99/month × 12)
- Trial: 14 days
- Copy Price ID → `STRIPE_PRICE_PRO_ANNUAL`

### 2. Set Up Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint**: `https://your-domain.com/api/webhooks/stripe`
3. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Environment Variables

Add to `apps/web/.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_LIGHT_MONTHLY=price_xxxxx
STRIPE_PRICE_LIGHT_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
```

### 4. Local Development Webhook Testing

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This gives you a webhook secret for local testing.

## User Flow

1. **User visits `/pricing`** → Sees Light and Pro plans
2. **Selects billing period** → Monthly or Annual (with 20% discount)
3. **Clicks "Start 14-Day Free Trial"** → Redirected to Stripe checkout
4. **Completes checkout** → Stripe creates subscription with 14-day trial
5. **Webhook receives event** → Updates user subscription in Convex
6. **User redirected to dashboard** → Shows subscription status

## Testing

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any CVC

### Test Flow
1. Visit `/pricing`
2. Select plan and billing period
3. Click "Start 14-Day Free Trial"
4. Use test card `4242 4242 4242 4242`
5. Complete checkout
6. Verify webhook receives event
7. Check user subscription in Convex

## Files Created/Modified

**Created:**
- `apps/web/app/pricing/page.tsx` - Pricing page
- `apps/web/app/api/checkout/route.ts` - Stripe checkout API
- `apps/web/app/api/webhooks/stripe/route.ts` - Webhook handler
- `convex/subscriptions.ts` - Subscription management

**Modified:**
- `convex/schema.ts` - Updated subscription tiers
- `apps/web/app/page.tsx` - Updated landing page pricing
- `convex/_generated/api.d.ts` - Added subscriptions module

**Dependencies Added:**
- `stripe@20.0.0` - Stripe Node.js SDK

## Next Steps

1. ✅ Stripe integration complete
2. ⏭️ Create products in Stripe dashboard
3. ⏭️ Set up webhook endpoint
4. ⏭️ Test checkout flow
5. ⏭️ Add subscription management page (`/settings/billing`)
6. ⏭️ Add cancellation flow
7. ⏭️ Add upgrade/downgrade flow

## Documentation

- `STRIPE_BILLING_SETUP.md` - Complete setup guide
- `CLERK_BILLING_SETUP.md` - Original Clerk approach (for reference)

