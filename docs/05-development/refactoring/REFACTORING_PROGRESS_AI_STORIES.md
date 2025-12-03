# Refactoring Progress - ai_stories.ts

**Started:** Current session  
**Target:** Reduce from 1,669 LOC to <600 LOC per file

## ✅ COMPLETED - All Story Functions Extracted

### File Size Reduction
- **Original:** 1,669 LOC
- **Current:** 21 LOC (re-exports only)
- **Reduction:** 1,648 lines removed (98.7% reduction)
- **Extracted Code:** 1,740 LOC in organized modules

### Structure Created

```
convex/
├── ai_stories.ts (21 LOC - re-exports only)
└── ai_stories/
    ├── types.ts (FinancialData interface)
    ├── prompts.ts (STORY_SYSTEM_PROMPTS)
    ├── api.ts (callOpenRouterAPI)
    ├── promptBuilders.ts (buildCompanyStoryPrompt, buildBankerStoryPrompt, buildInvestorStoryPrompt)
    ├── dataAggregation.ts (aggregateFinancialDataQuery)
    ├── mutations.ts (createStory, updateStory)
    ├── queries.ts (getStories, getStoryById)
    ├── export.ts (exportStory)
    └── generators/
        ├── company.ts (generateCompanyStory, _generateCompanyStoryInternal)
        ├── banker.ts (generateBankerStory, _generateBankerStoryInternal)
        └── investor.ts (generateInvestorStory, _generateInvestorStoryInternal)
```

### Extracted Modules
1. ✅ `types.ts` - FinancialData interface
2. ✅ `prompts.ts` - System prompts for all story types
3. ✅ `api.ts` - OpenRouter API integration
4. ✅ `promptBuilders.ts` - Prompt building functions
5. ✅ `dataAggregation.ts` - Financial data aggregation query
6. ✅ `mutations.ts` - Story CRUD mutations
7. ✅ `queries.ts` - Story queries
8. ✅ `export.ts` - Story export functionality
9. ✅ `generators/company.ts` - Company story generation
10. ✅ `generators/banker.ts` - Banker story generation
11. ✅ `generators/investor.ts` - Investor story generation

### Backward Compatibility
- ✅ All functions re-exported from main `ai_stories.ts`
- ✅ `api.ai_stories.*` continues to work
- ✅ No breaking changes to frontend

### Status
- ✅ All files created
- ✅ No linter errors
- ✅ All imports working correctly
- ✅ Public API maintained

