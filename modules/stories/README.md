# Stories Module

AI-powered narrative stories for financial data.

## Overview

The Stories module generates AI-powered narrative stories from financial data. It supports three types of stories:
- **Company Story**: Internal compass for understanding business performance
- **Banker Story**: Financial credibility profile for lenders
- **Investor Story**: Forward narrative and growth thesis for investors

## Features

- Generate stories for monthly, quarterly, or annual periods
- Export stories to PDF
- View story history and regenerate stories
- AI-powered insights and metrics

## Module Structure

```
modules/stories/
├── manifest.ts          # Module metadata and configuration
├── convex/              # Backend functions
│   ├── index.ts         # Re-exports
│   ├── queries.ts       # Story queries
│   ├── mutations.ts     # Story mutations
│   ├── api.ts           # OpenRouter API integration
│   ├── dataAggregation.ts
│   ├── export.ts
│   └── generators/      # Story generators
├── components/          # React components
│   ├── StoriesTab.tsx
│   ├── StoryCard.tsx
│   ├── StoryView.tsx
│   ├── StoryGenerator.tsx
│   └── storyConfig.ts
├── routes.ts            # Route definitions
├── navigation.ts        # Navigation items
└── permissions.ts        # Module permissions
```

## Usage

### Backend

Import from the module:
```typescript
import { getStories, generateCompanyStory } from "../modules/stories/convex";
```

Or use the backward-compatible export:
```typescript
import { getStories, generateCompanyStory } from "convex/ai_stories";
```

### Frontend

Import the component:
```typescript
import { StoriesTab } from "../modules/stories/components/StoriesTab";
```

## Permissions

- `VIEW_STORIES`: View stories
- `GENERATE_STORIES`: Generate new stories
- `EXPORT_STORIES`: Export stories to PDF

## Billing

Currently free for all subscription tiers.

## Data

Uses the `ai_stories` table in the database.

