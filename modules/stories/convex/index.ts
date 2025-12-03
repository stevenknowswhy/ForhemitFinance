/**
 * Stories Module Convex Functions
 * Re-exports all story functions from the module
 */

// Re-export data aggregation
export { aggregateFinancialDataQuery } from "./dataAggregation";

// Re-export story generators
export { generateCompanyStory, _generateCompanyStoryInternal } from "./generators/company";
export { generateBankerStory, _generateBankerStoryInternal } from "./generators/banker";
export { generateInvestorStory, _generateInvestorStoryInternal } from "./generators/investor";

// Re-export mutations
export { createStory, updateStory } from "./mutations";

// Re-export queries
export { getStories, getStoryById } from "./queries";

// Re-export export function
export { exportStory } from "./export";

