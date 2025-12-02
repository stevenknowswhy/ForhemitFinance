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
import type * as ai_stories from "../ai_stories.js";
import type * as audit from "../audit.js";
import type * as businessProfiles from "../businessProfiles.js";
import type * as crons from "../crons.js";
import type * as data_reset from "../data_reset.js";
import type * as duplicate_detection from "../duplicate_detection.js";
import type * as helpers_index from "../helpers/index.js";
import type * as helpers_orgContext from "../helpers/orgContext.js";
import type * as investor_reports from "../investor_reports.js";
import type * as knowledge_base from "../knowledge_base.js";
import type * as memberships from "../memberships.js";
import type * as migrations_phase1_multi_tenant from "../migrations/phase1_multi_tenant.js";
import type * as mock_data from "../mock_data.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as permissions from "../permissions.js";
import type * as plaid from "../plaid.js";
import type * as professionalContacts from "../professionalContacts.js";
import type * as rbac from "../rbac.js";
import type * as receipt_ocr from "../receipt_ocr.js";
import type * as reports from "../reports.js";
import type * as scheduled from "../scheduled.js";
import type * as split_suggestions from "../split_suggestions.js";
import type * as startup_metrics from "../startup_metrics.js";
import type * as subscriptions from "../subscriptions.js";
import type * as super_admin from "../super_admin.js";
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
  ai_stories: typeof ai_stories;
  audit: typeof audit;
  businessProfiles: typeof businessProfiles;
  crons: typeof crons;
  data_reset: typeof data_reset;
  duplicate_detection: typeof duplicate_detection;
  "helpers/index": typeof helpers_index;
  "helpers/orgContext": typeof helpers_orgContext;
  investor_reports: typeof investor_reports;
  knowledge_base: typeof knowledge_base;
  memberships: typeof memberships;
  "migrations/phase1_multi_tenant": typeof migrations_phase1_multi_tenant;
  mock_data: typeof mock_data;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  permissions: typeof permissions;
  plaid: typeof plaid;
  professionalContacts: typeof professionalContacts;
  rbac: typeof rbac;
  receipt_ocr: typeof receipt_ocr;
  reports: typeof reports;
  scheduled: typeof scheduled;
  split_suggestions: typeof split_suggestions;
  startup_metrics: typeof startup_metrics;
  subscriptions: typeof subscriptions;
  super_admin: typeof super_admin;
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
