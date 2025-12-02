# Deployment Guide - EZ Financial

## Overview

This guide covers deploying EZ Financial to production environments.

## Prerequisites

- Node.js 18+ (or Node.js 25+)
- pnpm 8+ (or pnpm 9+)
- Convex account and deployment
- Clerk account
- Plaid account (for production bank connections)
- Vercel account (recommended for Next.js deployment)

## Environment Variables

### Frontend (Next.js / Vercel)

Create `.env.local` or set in Vercel dashboard:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_production_url
CONVEX_DEPLOYMENT=your_convex_deployment

# Plaid (Production)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=production
PLAID_WEBHOOK_SECRET=your_plaid_webhook_secret

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
NEXT_PUBLIC_UPLOADTHING_URL=your_uploadthing_url

# Stripe (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Backend (Convex)

Set in Convex dashboard: Settings → Environment Variables

```env
# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key

# Plaid (if needed in Convex)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=production
```

## Deployment Steps

### 1. Deploy Convex Backend

```bash
# Install Convex CLI if not already installed
npm install -g convex

# Login to Convex
npx convex login

# Deploy to production
cd convex
npx convex deploy --prod
```

### 2. Deploy Next.js Frontend (Vercel)

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd apps/web
vercel --prod
```

#### Option B: Vercel Dashboard

1. Connect your GitHub repository to Vercel
2. Set root directory to `apps/web`
3. Configure environment variables
4. Deploy

### 3. Configure Webhooks

See [webhook-setup.md](./webhook-setup.md) for detailed webhook configuration.

### 4. Verify Deployment

1. Check Convex dashboard for function health
2. Test authentication flow
3. Test Plaid connection (sandbox first)
4. Verify webhook endpoints are accessible
5. Test transaction approval flow

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Convex functions deployed and healthy
- [ ] Next.js app deployed and accessible
- [ ] Authentication working
- [ ] Plaid webhooks configured
- [ ] Stripe webhooks configured (if applicable)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (if applicable)
- [ ] SSL certificates valid
- [ ] Domain configured (if custom domain)

## Monitoring

### Convex Dashboard

- Monitor function execution times
- Check error logs
- Review database usage

### Vercel Dashboard

- Monitor build status
- Check function logs
- Review performance metrics

### Application Monitoring

Consider setting up:
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Uptime monitoring

## Rollback Procedure

### Convex Rollback

```bash
# List deployments
npx convex deployments

# Rollback to previous deployment
npx convex deploy --version <previous-version>
```

### Vercel Rollback

1. Go to Vercel dashboard
2. Select deployment
3. Click "Promote to Production"

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for common issues and solutions.
