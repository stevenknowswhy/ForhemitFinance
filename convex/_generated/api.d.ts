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
import type * as ai_entries_actions from "../ai_entries/actions.js";
import type * as ai_entries_api from "../ai_entries/api.js";
import type * as ai_entries_helpers from "../ai_entries/helpers.js";
import type * as ai_entries_mutations from "../ai_entries/mutations.js";
import type * as ai_entries_prompts from "../ai_entries/prompts.js";
import type * as ai_entries_queries from "../ai_entries/queries.js";
import type * as ai_entries_types from "../ai_entries/types.js";
import type * as ai_stories from "../ai_stories.js";
import type * as ai_stories_api from "../ai_stories/api.js";
import type * as ai_stories_dataAggregation from "../ai_stories/dataAggregation.js";
import type * as ai_stories_export from "../ai_stories/export.js";
import type * as ai_stories_generators_banker from "../ai_stories/generators/banker.js";
import type * as ai_stories_generators_company from "../ai_stories/generators/company.js";
import type * as ai_stories_generators_investor from "../ai_stories/generators/investor.js";
import type * as ai_stories_mutations from "../ai_stories/mutations.js";
import type * as ai_stories_promptBuilders from "../ai_stories/promptBuilders.js";
import type * as ai_stories_prompts from "../ai_stories/prompts.js";
import type * as ai_stories_queries from "../ai_stories/queries.js";
import type * as ai_stories_types from "../ai_stories/types.js";
import type * as audit from "../audit.js";
import type * as businessProfiles from "../businessProfiles.js";
import type * as crons from "../crons.js";
import type * as data_reset from "../data_reset.js";
import type * as duplicate_detection from "../duplicate_detection.js";
import type * as helpers_convexLimits from "../helpers/convexLimits.js";
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
import type * as plaid_accounts from "../plaid/accounts.js";
import type * as plaid_analytics from "../plaid/analytics.js";
import type * as plaid_institutions from "../plaid/institutions.js";
import type * as plaid_link from "../plaid/link.js";
import type * as plaid_mock from "../plaid/mock.js";
import type * as plaid_sdk from "../plaid/sdk.js";
import type * as plaid_transactions from "../plaid/transactions.js";
import type * as professionalContacts from "../professionalContacts.js";
import type * as rbac from "../rbac.js";
import type * as receipt_ocr from "../receipt_ocr.js";
import type * as reports from "../reports.js";
import type * as reports_accountsPayable from "../reports/accountsPayable.js";
import type * as reports_accountsReceivable from "../reports/accountsReceivable.js";
import type * as reports_balanceSheet from "../reports/balanceSheet.js";
import type * as reports_bankLender from "../reports/bankLender.js";
import type * as reports_burnRateRunway from "../reports/burnRateRunway.js";
import type * as reports_cashFlow from "../reports/cashFlow.js";
import type * as reports_financialSummary from "../reports/financialSummary.js";
import type * as reports_generalLedger from "../reports/generalLedger.js";
import type * as reports_kpiDashboard from "../reports/kpiDashboard.js";
import type * as reports_profitLoss from "../reports/profitLoss.js";
import type * as reports_taxPreparation from "../reports/taxPreparation.js";
import type * as reports_trialBalance from "../reports/trialBalance.js";
import type * as reports_utils from "../reports/utils.js";
import type * as reports_vendorSpendAnalysis from "../reports/vendorSpendAnalysis.js";
import type * as reports_yearEndAccountantPack from "../reports/yearEndAccountantPack.js";
import type * as scheduled from "../scheduled.js";
import type * as split_suggestions from "../split_suggestions.js";
import type * as startup_metrics from "../startup_metrics.js";
import type * as subscriptions from "../subscriptions.js";
import type * as super_admin from "../super_admin.js";
import type * as transactions from "../transactions.js";
import type * as transactions_actions from "../transactions/actions.js";
import type * as transactions_mutations from "../transactions/mutations.js";
import type * as transactions_queries from "../transactions/queries.js";
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
  "ai_entries/actions": typeof ai_entries_actions;
  "ai_entries/api": typeof ai_entries_api;
  "ai_entries/helpers": typeof ai_entries_helpers;
  "ai_entries/mutations": typeof ai_entries_mutations;
  "ai_entries/prompts": typeof ai_entries_prompts;
  "ai_entries/queries": typeof ai_entries_queries;
  "ai_entries/types": typeof ai_entries_types;
  ai_stories: typeof ai_stories;
  "ai_stories/api": typeof ai_stories_api;
  "ai_stories/dataAggregation": typeof ai_stories_dataAggregation;
  "ai_stories/export": typeof ai_stories_export;
  "ai_stories/generators/banker": typeof ai_stories_generators_banker;
  "ai_stories/generators/company": typeof ai_stories_generators_company;
  "ai_stories/generators/investor": typeof ai_stories_generators_investor;
  "ai_stories/mutations": typeof ai_stories_mutations;
  "ai_stories/promptBuilders": typeof ai_stories_promptBuilders;
  "ai_stories/prompts": typeof ai_stories_prompts;
  "ai_stories/queries": typeof ai_stories_queries;
  "ai_stories/types": typeof ai_stories_types;
  audit: typeof audit;
  businessProfiles: typeof businessProfiles;
  crons: typeof crons;
  data_reset: typeof data_reset;
  duplicate_detection: typeof duplicate_detection;
  "helpers/convexLimits": typeof helpers_convexLimits;
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
  "plaid/accounts": typeof plaid_accounts;
  "plaid/analytics": typeof plaid_analytics;
  "plaid/institutions": typeof plaid_institutions;
  "plaid/link": typeof plaid_link;
  "plaid/mock": typeof plaid_mock;
  "plaid/sdk": typeof plaid_sdk;
  "plaid/transactions": typeof plaid_transactions;
  professionalContacts: typeof professionalContacts;
  rbac: typeof rbac;
  receipt_ocr: typeof receipt_ocr;
  reports: typeof reports;
  "reports/accountsPayable": typeof reports_accountsPayable;
  "reports/accountsReceivable": typeof reports_accountsReceivable;
  "reports/balanceSheet": typeof reports_balanceSheet;
  "reports/bankLender": typeof reports_bankLender;
  "reports/burnRateRunway": typeof reports_burnRateRunway;
  "reports/cashFlow": typeof reports_cashFlow;
  "reports/financialSummary": typeof reports_financialSummary;
  "reports/generalLedger": typeof reports_generalLedger;
  "reports/kpiDashboard": typeof reports_kpiDashboard;
  "reports/profitLoss": typeof reports_profitLoss;
  "reports/taxPreparation": typeof reports_taxPreparation;
  "reports/trialBalance": typeof reports_trialBalance;
  "reports/utils": typeof reports_utils;
  "reports/vendorSpendAnalysis": typeof reports_vendorSpendAnalysis;
  "reports/yearEndAccountantPack": typeof reports_yearEndAccountantPack;
  scheduled: typeof scheduled;
  split_suggestions: typeof split_suggestions;
  startup_metrics: typeof startup_metrics;
  subscriptions: typeof subscriptions;
  super_admin: typeof super_admin;
  transactions: typeof transactions;
  "transactions/actions": typeof transactions_actions;
  "transactions/mutations": typeof transactions_mutations;
  "transactions/queries": typeof transactions_queries;
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
