/**
 * Plaid SDK loading and client configuration
 * Uses dynamic imports to avoid bundling issues with Convex
 */

// Plaid types - will be loaded dynamically at runtime
type PlaidApiType = any;
type PlaidEnvironmentsType = any;
type ProductsType = any;
type CountryCodeType = any;
type ConfigurationType = any;

let PlaidApi: PlaidApiType | undefined;
let PlaidEnvironments: PlaidEnvironmentsType | undefined;
let Products: ProductsType | undefined;
let CountryCode: CountryCodeType | undefined;
let Configuration: ConfigurationType | undefined;

/**
 * Lazy load Plaid SDK - only when needed
 */
export async function loadPlaidSDK(): Promise<{
  PlaidApi: any;
  PlaidEnvironments: any;
  Products: any;
  CountryCode: any;
  Configuration: any;
} | null> {
  // If already loaded, return the SDK
  if (PlaidApi && PlaidEnvironments && Configuration) {
    return {
      PlaidApi,
      PlaidEnvironments,
      Products: Products!,
      CountryCode: CountryCode!,
      Configuration,
    };
  }

  try {
    // Dynamic import that won't fail at bundle time
    const plaid = await import("plaid");
    PlaidApi = plaid.PlaidApi;
    PlaidEnvironments = plaid.PlaidEnvironments;
    Products = plaid.Products;
    CountryCode = plaid.CountryCode;
    Configuration = plaid.Configuration;

    return {
      PlaidApi,
      PlaidEnvironments,
      Products,
      CountryCode,
      Configuration,
    };
  } catch (e) {
    // Plaid not available - will use mock mode
    console.warn("Plaid SDK not available - using mock mode");
    return null;
  }
}

/**
 * Get Plaid client configuration
 * Loads Plaid SDK dynamically if available
 */
export async function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV || "sandbox";

  if (!clientId || !secret) {
    // Return null to indicate mock mode should be used
    return null;
  }

  // Try to load Plaid SDK dynamically
  const plaidSDK = await loadPlaidSDK();

  if (!plaidSDK) {
    // Plaid SDK not available
    return null;
  }

  try {
    const { Configuration, PlaidApi, PlaidEnvironments } = plaidSDK;
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
        },
      },
    });

    return new PlaidApi(configuration);
  } catch (error) {
    console.error("Error creating Plaid client:", error);
    return null;
  }
}

