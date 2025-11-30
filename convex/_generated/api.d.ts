/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as addresses from "../addresses.js";
import type * as ai_entries from "../ai_entries.js";
import type * as businessProfiles from "../businessProfiles.js";
import type * as duplicate_detection from "../duplicate_detection.js";
import type * as investor_reports from "../investor_reports.js";
import type * as knowledge_base from "../knowledge_base.js";
import type * as onboarding from "../onboarding.js";
import type * as plaid from "../plaid.js";
import type * as professionalContacts from "../professionalContacts.js";
import type * as receipt_ocr from "../receipt_ocr.js";
import type * as reports from "../reports.js";
import type * as split_suggestions from "../split_suggestions.js";
import type * as startup_metrics from "../startup_metrics.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  addresses: typeof addresses;
  ai_entries: typeof ai_entries;
  businessProfiles: typeof businessProfiles;
  duplicate_detection: typeof duplicate_detection;
  investor_reports: typeof investor_reports;
  knowledge_base: typeof knowledge_base;
  onboarding: typeof onboarding;
  plaid: typeof plaid;
  professionalContacts: typeof professionalContacts;
  receipt_ocr: typeof receipt_ocr;
  reports: typeof reports;
  split_suggestions: typeof split_suggestions;
  startup_metrics: typeof startup_metrics;
  subscriptions: typeof subscriptions;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
