# Clerk Billing & Subscription Setup Guide

## Overview

This guide explains how to set up subscriptions and payments through Clerk with:
- **Light Plan**: $19.99/month or $159.92/year (20% discount)
- **Pro Plan**: $29.99/month or $239.92/year (20% discount)
- **14-day free trial** for both plans
- **Annual billing** with 20% discount

## Step 1: Set Up Products in Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Navigate to **Billing** → **Products**
3. Create two products:

### Light Plan
- **Name**: Light
- **Description**: Perfect for solo founders and small startups
- **Prices**:
  - Monthly: $19.99/month
  - Annual: $159.92/year (billed annually, save 20%)

### Pro Plan
- **Name**: Pro
- **Description**: For growing startups and teams
- **Prices**:
  - Monthly: $29.99/month
  - Annual: $239.92/year (billed annually, save 20%)

4. **Enable 14-day free trial** for both products
5. Copy the **Price IDs** for each plan (you'll need these)

## Step 2: Configure Webhook

1. In Clerk Dashboard, go to **Webhooks**
2. Create a new webhook endpoint: `https://your-domain.com/api/clerk-webhook`
3. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Copy the **Webhook Secret** and add to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

## Step 3: Update Price IDs

Update the price IDs in `apps/web/app/pricing/page.tsx`:

```typescript
clerkPriceId: {
  monthly: "price_xxxxx", // From Clerk dashboard
  annual: "price_xxxxx",   // From Clerk dashboard
}
```

## Step 4: Implement Checkout Flow

### Option A: Clerk Hosted Checkout (Recommended)

Use Clerk's hosted checkout page. Update `handleSubscribe` in `pricing/page.tsx`:

```typescript
const handleSubscribe = async (plan: "light" | "pro") => {
  if (!user) {
    window.location.href = "/sign-up?redirect=/pricing";
    return;
  }

  const priceId = PRICING_PLANS[plan].clerkPriceId[billingPeriod];
  
  // Redirect to Clerk checkout
  const checkoutUrl = await createCheckoutSession(priceId, user.id);
  window.location.href = checkoutUrl;
};
```

### Option B: Custom Checkout with Clerk API

Create an API route to create checkout sessions:

```typescript
// apps/web/app/api/checkout/route.ts
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();
  
  // Create checkout session via Clerk API
  const session = await clerkClient.billing.createCheckoutSession({
    userId,
    priceId,
    trialDays: 14,
  });
  
  return Response.json({ url: session.url });
}
```

## Step 5: Handle Webhook Events

The webhook handler (`apps/web/app/api/clerk-webhook/route.ts`) processes subscription events:

- **checkout.session.completed**: User completed checkout → Update subscription status
- **customer.subscription.created**: New subscription → Start trial or activate
- **customer.subscription.updated**: Subscription changed → Update tier
- **customer.subscription.deleted**: Subscription cancelled → Downgrade to free

## Step 6: Update User Schema

The user schema already includes `subscriptionTier`. You may want to add:

```typescript
subscriptionStatus: v.union(
  v.literal("trial"),
  v.literal("active"),
  v.literal("cancelled"),
  v.literal("past_due")
),
trialEndsAt: v.optional(v.number()),
billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
clerkSubscriptionId: v.optional(v.string()),
```

## Step 7: Trial Period Logic

The trial period is handled automatically by Clerk, but you can check it:

```typescript
// In convex/subscriptions.ts
export const isInTrial = query({
  handler: async (ctx) => {
    // Check if user is within 14 days of signup
    // Or check Clerk subscription status
  },
});
```

## Pricing Details

### Light Plan
- **Monthly**: $19.99/month
- **Annual**: $159.92/year ($13.33/month) - **Save 20%**
- **Trial**: 14 days free

### Pro Plan
- **Monthly**: $29.99/month
- **Annual**: $239.92/year ($19.99/month) - **Save 20%**
- **Trial**: 14 days free

## Testing

1. **Test Checkout Flow**:
   - Visit `/pricing`
   - Select a plan and billing period
   - Complete checkout (use Clerk test mode)
   - Verify webhook receives event

2. **Test Trial Period**:
   - Sign up new user
   - Subscribe to plan
   - Verify 14-day trial starts
   - Check subscription status after trial

3. **Test Annual Discount**:
   - Select annual billing
   - Verify 20% discount applied
   - Check billing amount

## Environment Variables

Add to `apps/web/.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CONVEX_URL=...
```

## Files Created/Modified

**Created:**
- `apps/web/app/pricing/page.tsx` - Pricing page with subscription options
- `apps/web/app/api/clerk-webhook/route.ts` - Webhook handler for Clerk events
- `convex/subscriptions.ts` - Subscription management functions

**Modified:**
- `convex/schema.ts` - Updated subscription tiers (solo, light, pro)

## Next Steps

1. ✅ Set up products in Clerk dashboard
2. ✅ Configure webhook endpoint
3. ⏭️ Implement checkout session creation
4. ⏭️ Test checkout flow
5. ⏭️ Add subscription management page (`/settings/billing`)
6. ⏭️ Handle subscription upgrades/downgrades
7. ⏭️ Add cancellation flow

## Clerk Billing API Reference

- Clerk Billing Docs: https://clerk.com/docs/billing
- Webhook Events: https://clerk.com/docs/webhooks
- Checkout Sessions: https://clerk.com/docs/billing/checkout

