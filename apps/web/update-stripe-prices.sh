#!/bin/bash
# Helper script to update Stripe price IDs in .env.local

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local file not found!"
  exit 1
fi

echo "📝 Updating Stripe price IDs in .env.local..."

# Backup original file
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Created backup: ${ENV_FILE}.backup"

# Update price IDs (using sed for in-place editing)
sed -i '' 's/STRIPE_PRICE_LIGHT_MONTHLY=.*/STRIPE_PRICE_LIGHT_MONTHLY=price_prod_TVTjZnO1sXXohA/' "$ENV_FILE"
sed -i '' 's/STRIPE_PRICE_LIGHT_ANNUAL=.*/STRIPE_PRICE_LIGHT_ANNUAL=price_prod_TVTlJ6UtDm3SFt/' "$ENV_FILE"
sed -i '' 's/STRIPE_PRICE_PRO_MONTHLY=.*/STRIPE_PRICE_PRO_MONTHLY=price_prod_TVTjEl9vN4oErQ/' "$ENV_FILE"
sed -i '' 's/STRIPE_PRICE_PRO_ANNUAL=.*/STRIPE_PRICE_PRO_ANNUAL=price_prod_TVTl8SqqPJrfKB/' "$ENV_FILE"

echo "✅ Updated Stripe price IDs"
echo ""
echo "Run 'node validate-env.js' to verify the changes"
