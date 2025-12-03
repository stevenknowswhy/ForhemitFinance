/**
 * AI Stories Generation (Phase 2)
 * Re-exports all story functions from the stories module
 * 
 * Note: This file maintains backward compatibility.
 * The actual implementation is in modules/stories/convex/
 */

// Re-export from stories module
export { aggregateFinancialDataQuery } from "./modules/stories/dataAggregation";
export { generateCompanyStory, _generateCompanyStoryInternal } from "./modules/stories/generators/company";
export { generateBankerStory, _generateBankerStoryInternal } from "./modules/stories/generators/banker";
export { generateInvestorStory, _generateInvestorStoryInternal } from "./modules/stories/generators/investor";
export { createStory, updateStory } from "./modules/stories/mutations";
export { getStories, getStoryById } from "./modules/stories/queries";
export { exportStory } from "./modules/stories/export";
