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
import type * as addons from "../addons.js";
import type * as addresses from "../addresses.js";
import type * as ai_agents from "../ai_agents.js";
import type * as ai_entries from "../ai_entries.js";
import type * as ai_entries_actions from "../ai_entries/actions.js";
import type * as ai_entries_api from "../ai_entries/api.js";
import type * as ai_entries_helpers from "../ai_entries/helpers.js";
import type * as ai_entries_mutations from "../ai_entries/mutations.js";
import type * as ai_entries_prompts from "../ai_entries/prompts.js";
import type * as ai_entries_queries from "../ai_entries/queries.js";
import type * as ai_entries_types from "../ai_entries/types.js";
import type * as ai_insights from "../ai_insights.js";
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
import type * as ai_stories_seedTemplates from "../ai_stories/seedTemplates.js";
import type * as ai_stories_types from "../ai_stories/types.js";
import type * as audit from "../audit.js";
import type * as bill_subscriptions from "../bill_subscriptions.js";
import type * as bills from "../bills.js";
import type * as businessProfiles from "../businessProfiles.js";
import type * as businessTypes from "../businessTypes.js";
import type * as calendar from "../calendar.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as data_reset from "../data_reset.js";
import type * as duplicate_detection from "../duplicate_detection.js";
import type * as helpers_convexLimits from "../helpers/convexLimits.js";
import type * as helpers_index from "../helpers/index.js";
import type * as helpers_orgContext from "../helpers/orgContext.js";
import type * as investor_reports from "../investor_reports.js";
import type * as invoices from "../invoices.js";
import type * as knowledge_base from "../knowledge_base.js";
import type * as marketplace_checkout from "../marketplace/checkout.js";
import type * as marketplace_entitlements from "../marketplace/entitlements.js";
import type * as marketplace_registry from "../marketplace/registry.js";
import type * as memberships from "../memberships.js";
import type * as migrations_backfill_entry_lines from "../migrations/backfill_entry_lines.js";
import type * as migrations_enable_modules from "../migrations/enable_modules.js";
import type * as migrations_phase1_multi_tenant from "../migrations/phase1_multi_tenant.js";
import type * as migrations_runner from "../migrations/runner.js";
import type * as mileage from "../mileage.js";
import type * as mock_data from "../mock_data.js";
import type * as moduleEntitlements from "../moduleEntitlements.js";
import type * as moduleManifests from "../moduleManifests.js";
import type * as modules from "../modules.js";
import type * as modules_projects_main from "../modules/projects/main.js";
import type * as modules_reports_accountsPayable from "../modules/reports/accountsPayable.js";
import type * as modules_reports_accountsReceivable from "../modules/reports/accountsReceivable.js";
import type * as modules_reports_balanceSheet from "../modules/reports/balanceSheet.js";
import type * as modules_reports_bankLender from "../modules/reports/bankLender.js";
import type * as modules_reports_burnRateRunway from "../modules/reports/burnRateRunway.js";
import type * as modules_reports_cashFlow from "../modules/reports/cashFlow.js";
import type * as modules_reports_financialSummary from "../modules/reports/financialSummary.js";
import type * as modules_reports_generalLedger from "../modules/reports/generalLedger.js";
import type * as modules_reports_index from "../modules/reports/index.js";
import type * as modules_reports_kpiDashboard from "../modules/reports/kpiDashboard.js";
import type * as modules_reports_profitLoss from "../modules/reports/profitLoss.js";
import type * as modules_reports_taxPreparation from "../modules/reports/taxPreparation.js";
import type * as modules_reports_trialBalance from "../modules/reports/trialBalance.js";
import type * as modules_reports_utils from "../modules/reports/utils.js";
import type * as modules_reports_vendorSpendAnalysis from "../modules/reports/vendorSpendAnalysis.js";
import type * as modules_reports_yearEndAccountantPack from "../modules/reports/yearEndAccountantPack.js";
import type * as modules_stories_api from "../modules/stories/api.js";
import type * as modules_stories_dataAggregation from "../modules/stories/dataAggregation.js";
import type * as modules_stories_export from "../modules/stories/export.js";
import type * as modules_stories_generators_banker from "../modules/stories/generators/banker.js";
import type * as modules_stories_generators_company from "../modules/stories/generators/company.js";
import type * as modules_stories_generators_investor from "../modules/stories/generators/investor.js";
import type * as modules_stories_index from "../modules/stories/index.js";
import type * as modules_stories_mutations from "../modules/stories/mutations.js";
import type * as modules_stories_promptBuilders from "../modules/stories/promptBuilders.js";
import type * as modules_stories_prompts from "../modules/stories/prompts.js";
import type * as modules_stories_queries from "../modules/stories/queries.js";
import type * as modules_stories_types from "../modules/stories/types.js";
import type * as modules_time_tracking_main from "../modules/time_tracking/main.js";
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
import type * as reports_investorTemplate from "../reports/investorTemplate.js";
import type * as reports_kpiDashboard from "../reports/kpiDashboard.js";
import type * as reports_profitLoss from "../reports/profitLoss.js";
import type * as reports_queries from "../reports/queries.js";
import type * as reports_seed from "../reports/seed.js";
import type * as reports_taxPreparation from "../reports/taxPreparation.js";
import type * as reports_trialBalance from "../reports/trialBalance.js";
import type * as reports_utils from "../reports/utils.js";
import type * as reports_vendorSpendAnalysis from "../reports/vendorSpendAnalysis.js";
import type * as reports_yearEndAccountantPack from "../reports/yearEndAccountantPack.js";
import type * as scheduled from "../scheduled.js";
import type * as seed from "../seed.js";
import type * as split_suggestions from "../split_suggestions.js";
import type * as startup_metrics from "../startup_metrics.js";
import type * as subscriptions from "../subscriptions.js";
import type * as super_admin from "../super_admin.js";
import type * as transactions from "../transactions.js";
import type * as transactions_actions from "../transactions/actions.js";
import type * as transactions_mutations from "../transactions/mutations.js";
import type * as transactions_queries from "../transactions/queries.js";
import type * as users from "../users.js";
import type * as vendors from "../vendors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  addons: typeof addons;
  addresses: typeof addresses;
  ai_agents: typeof ai_agents;
  ai_entries: typeof ai_entries;
  "ai_entries/actions": typeof ai_entries_actions;
  "ai_entries/api": typeof ai_entries_api;
  "ai_entries/helpers": typeof ai_entries_helpers;
  "ai_entries/mutations": typeof ai_entries_mutations;
  "ai_entries/prompts": typeof ai_entries_prompts;
  "ai_entries/queries": typeof ai_entries_queries;
  "ai_entries/types": typeof ai_entries_types;
  ai_insights: typeof ai_insights;
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
  "ai_stories/seedTemplates": typeof ai_stories_seedTemplates;
  "ai_stories/types": typeof ai_stories_types;
  audit: typeof audit;
  bill_subscriptions: typeof bill_subscriptions;
  bills: typeof bills;
  businessProfiles: typeof businessProfiles;
  businessTypes: typeof businessTypes;
  calendar: typeof calendar;
  categories: typeof categories;
  crons: typeof crons;
  data_reset: typeof data_reset;
  duplicate_detection: typeof duplicate_detection;
  "helpers/convexLimits": typeof helpers_convexLimits;
  "helpers/index": typeof helpers_index;
  "helpers/orgContext": typeof helpers_orgContext;
  investor_reports: typeof investor_reports;
  invoices: typeof invoices;
  knowledge_base: typeof knowledge_base;
  "marketplace/checkout": typeof marketplace_checkout;
  "marketplace/entitlements": typeof marketplace_entitlements;
  "marketplace/registry": typeof marketplace_registry;
  memberships: typeof memberships;
  "migrations/backfill_entry_lines": typeof migrations_backfill_entry_lines;
  "migrations/enable_modules": typeof migrations_enable_modules;
  "migrations/phase1_multi_tenant": typeof migrations_phase1_multi_tenant;
  "migrations/runner": typeof migrations_runner;
  mileage: typeof mileage;
  mock_data: typeof mock_data;
  moduleEntitlements: typeof moduleEntitlements;
  moduleManifests: typeof moduleManifests;
  modules: typeof modules;
  "modules/projects/main": typeof modules_projects_main;
  "modules/reports/accountsPayable": typeof modules_reports_accountsPayable;
  "modules/reports/accountsReceivable": typeof modules_reports_accountsReceivable;
  "modules/reports/balanceSheet": typeof modules_reports_balanceSheet;
  "modules/reports/bankLender": typeof modules_reports_bankLender;
  "modules/reports/burnRateRunway": typeof modules_reports_burnRateRunway;
  "modules/reports/cashFlow": typeof modules_reports_cashFlow;
  "modules/reports/financialSummary": typeof modules_reports_financialSummary;
  "modules/reports/generalLedger": typeof modules_reports_generalLedger;
  "modules/reports/index": typeof modules_reports_index;
  "modules/reports/kpiDashboard": typeof modules_reports_kpiDashboard;
  "modules/reports/profitLoss": typeof modules_reports_profitLoss;
  "modules/reports/taxPreparation": typeof modules_reports_taxPreparation;
  "modules/reports/trialBalance": typeof modules_reports_trialBalance;
  "modules/reports/utils": typeof modules_reports_utils;
  "modules/reports/vendorSpendAnalysis": typeof modules_reports_vendorSpendAnalysis;
  "modules/reports/yearEndAccountantPack": typeof modules_reports_yearEndAccountantPack;
  "modules/stories/api": typeof modules_stories_api;
  "modules/stories/dataAggregation": typeof modules_stories_dataAggregation;
  "modules/stories/export": typeof modules_stories_export;
  "modules/stories/generators/banker": typeof modules_stories_generators_banker;
  "modules/stories/generators/company": typeof modules_stories_generators_company;
  "modules/stories/generators/investor": typeof modules_stories_generators_investor;
  "modules/stories/index": typeof modules_stories_index;
  "modules/stories/mutations": typeof modules_stories_mutations;
  "modules/stories/promptBuilders": typeof modules_stories_promptBuilders;
  "modules/stories/prompts": typeof modules_stories_prompts;
  "modules/stories/queries": typeof modules_stories_queries;
  "modules/stories/types": typeof modules_stories_types;
  "modules/time_tracking/main": typeof modules_time_tracking_main;
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
  "reports/investorTemplate": typeof reports_investorTemplate;
  "reports/kpiDashboard": typeof reports_kpiDashboard;
  "reports/profitLoss": typeof reports_profitLoss;
  "reports/queries": typeof reports_queries;
  "reports/seed": typeof reports_seed;
  "reports/taxPreparation": typeof reports_taxPreparation;
  "reports/trialBalance": typeof reports_trialBalance;
  "reports/utils": typeof reports_utils;
  "reports/vendorSpendAnalysis": typeof reports_vendorSpendAnalysis;
  "reports/yearEndAccountantPack": typeof reports_yearEndAccountantPack;
  scheduled: typeof scheduled;
  seed: typeof seed;
  split_suggestions: typeof split_suggestions;
  startup_metrics: typeof startup_metrics;
  subscriptions: typeof subscriptions;
  super_admin: typeof super_admin;
  transactions: typeof transactions;
  "transactions/actions": typeof transactions_actions;
  "transactions/mutations": typeof transactions_mutations;
  "transactions/queries": typeof transactions_queries;
  users: typeof users;
  vendors: typeof vendors;
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
