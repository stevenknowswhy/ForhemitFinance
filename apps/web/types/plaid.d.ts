// Type declaration for plaid package (used in Convex backend)
// This allows TypeScript to resolve plaid imports when type-checking Convex code
declare module 'plaid' {
  export class Configuration {
    constructor(config: any);
  }
  export class PlaidApi {
    constructor(config: any);
  }
  export const PlaidEnvironments: any;
  export const Products: any;
  export const CountryCode: any;
}

