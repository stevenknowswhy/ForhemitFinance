/**
 * AI Stories Generation (Phase 2)
 * Re-exports all story functions from the ai_stories/ directory
 */

// Re-export data aggregation
export { aggregateFinancialDataQuery } from "./ai_stories/dataAggregation";

// Re-export story generators
export { generateCompanyStory, _generateCompanyStoryInternal } from "./ai_stories/generators/company";
export { generateBankerStory, _generateBankerStoryInternal } from "./ai_stories/generators/banker";
export { generateInvestorStory, _generateInvestorStoryInternal } from "./ai_stories/generators/investor";

// Re-export mutations
export { createStory, updateStory } from "./ai_stories/mutations";

// Re-export queries
export { getStories, getStoryById } from "./ai_stories/queries";

// Re-export export function
export { exportStory } from "./ai_stories/export";
