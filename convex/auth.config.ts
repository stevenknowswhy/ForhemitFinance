/**
 * Convex Auth Configuration
 * Configured to work with Clerk
 */

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://allowing-cow-9.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

