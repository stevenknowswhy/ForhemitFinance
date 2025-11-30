# PRD — EZ Financial Phase 2: AI Stories (Forhemit Finance Stories)

## 1. Purpose

Define the AI Stories feature—a dedicated space where the system automatically transforms financial data into clear, narrative-driven reports tailored to three different audiences. This is a signature feature that differentiates EZ Financial from competitors.

## 2. Problem Statement

Founders need to communicate their financial position to different audiences (internal team, banks, investors), but:
- They don't have time to create custom reports for each audience
- They lack the financial expertise to frame the story correctly
- Manual report creation is time-consuming and error-prone
- Different audiences need different perspectives on the same data

AI Stories solves this by automatically generating three tailored narratives from the same financial data.

## 3. Core Feature: AI Stories

### 3.1 The Three Story Types

#### 3.1.1 The Company Story ("Internal Compass")

**Audience:**
- CEO, founders, employees, team leads, advisors

**Tone & Purpose:**
- Clear, honest, operationally useful
- Aligned with reality
- Bite-sized but comprehensive

**Focus Areas:**
- Monthly burn rate explained in plain language
- What's improving vs. declining
- Cash runway (in simple English)
- Revenue breakdowns and trends
- Cost drivers that are quietly growing
- Seasonality patterns
- Recommendations ("Here are three moves that would improve cash health next month")
- "What changed since last month?"
- "What changed since last quarter?"

**Goal:**
Give founders instant clarity so they can make faster decisions. Think of it as the company's financial journal entry.

#### 3.1.2 The Banker / Creditor Story ("Financial Credibility Profile")

**Audience:**
- Banks, lenders, loan officers, creditors, card issuers

**Tone & Purpose:**
- Stable, conservative, cautious
- Highlighting reliability and repayment strength
- No hype. No forward-looking fantasies
- Just: Are you safe to lend to?

**Focus Areas:**
- Debt-to-income and debt-to-revenue ratios
- Cash flow reliability
- Payment history patterns
- Upcoming liabilities
- Cushion and reserves
- Evidence of financial discipline
- Forecasting repayment likelihood
- Flags (late payments, abnormal cash spikes, etc.)

**Goal:**
Present a bank-friendly picture that says: "This business is steady, predictable, and safe to work with."

#### 3.1.3 The Investor Story ("Forward Narrative + Growth Thesis")

**Audience:**
- Angel investors, VCs, accelerators, future partners

**Tone & Purpose:**
- Forward-looking, opportunity-driven
- Honest, grounded in evidence
- Investment-grade clarity without jargon

**Focus Areas:**
- Current financial position + clean narrative
- Growth indicators
- Revenue efficiency (LTV/CAC, churn, retention depending on business type)
- Milestones achieved
- Upcoming milestones
- Scalable opportunities
- Risks (but framed responsibly)
- 12–24 month outlook

**Goal:**
Help founders articulate the case for investing in them—with zero fluff. This becomes their "always-current investor update" without effort.

### 3.2 Auto-Generation Cadence

Each story is automatically generated at three intervals:

**Monthly (Concise Summary):**
- Quick overview of the month
- Key changes and trends
- Actionable recommendations
- ~500-800 words per story

**Quarterly (Deeper Analysis):**
- Comprehensive quarter review
- Comparative analysis (this quarter vs. last quarter, vs. same quarter last year)
- Trend analysis across multiple periods
- Strategic recommendations
- ~1,500-2,500 words per story

**Annually (Full Narrative Annual Report):**
- Complete year-in-review
- Full financial narrative
- Multi-year trends
- Comprehensive outlook
- ~3,000-5,000 words per story

### 3.3 User Features

**Add Context:**
- Notes on each story
- Attachments (documents, images)
- Manual context (new product launch, hiring changes, market events, etc.)

**Export Options:**
- PDF export (formatted for each audience)
- Shareable link (read-only, password-protected)
- Investor Update format (email-ready)
- Bank-friendly report format
- CSV data export

**Customization:**
- Users can edit/refine AI-generated narratives
- Add custom sections
- Highlight specific metrics
- Version history (track changes over time)

## 4. Technical Requirements

### 4.1 Backend Functions

**File**: `convex/ai_stories.ts` (NEW)

**Functions to Implement:**
- `generateCompanyStory(userId, period, periodType)` - Generate company story
- `generateBankerStory(userId, period, periodType)` - Generate banker/creditor story
- `generateInvestorStory(userId, period, periodType)` - Generate investor story
- `getStories(userId, periodType?)` - Get all stories for user
- `getStoryById(storyId)` - Get specific story
- `updateStory(storyId, userNotes, attachments)` - Add user context
- `exportStory(storyId, format)` - Export story in various formats

**Data Sources:**
- Approved entries from `entries_final`
- Account balances
- Transaction history
- Goals and milestones
- Historical trends
- User preferences and business type

**AI Integration:**
- Use OpenRouter API (same as AI entries)
- Models: `x-ai/grok-4.1-fast:free` (primary), fallbacks as configured
- Prompt engineering for each story type
- Structured output format (JSON → formatted narrative)

### 4.2 Schema Updates

**File**: `convex/schema.ts` (UPDATE)

**New Table**: `ai_stories`
```typescript
ai_stories: defineTable({
  userId: v.id("users"),
  storyType: v.union(
    v.literal("company"),
    v.literal("banker"),
    v.literal("investor")
  ),
  periodType: v.union(
    v.literal("monthly"),
    v.literal("quarterly"),
    v.literal("annually")
  ),
  periodStart: v.number(), // Timestamp
  periodEnd: v.number(), // Timestamp
  title: v.string(),
  narrative: v.string(), // Full AI-generated narrative
  summary: v.string(), // Short summary for card preview
  keyMetrics: v.object({
    // Story-specific metrics
  }),
  userNotes: v.optional(v.string()),
  attachments: v.optional(v.array(v.string())), // URLs or file references
  version: v.number(), // Track edits
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### 4.3 UI Components

**File**: `apps/web/app/stories/page.tsx` (NEW)
- Main Stories page with three story cards
- Quick previews for each story type
- Navigation to full story views

**File**: `apps/web/app/stories/components/StoryCard.tsx` (NEW)
- Card component showing story preview
- Story type indicator (Company/Banker/Investor)
- Period indicator (Monthly/Quarterly/Annually)
- Last updated timestamp
- Quick actions (View, Export, Edit)

**File**: `apps/web/app/stories/components/StoryView.tsx` (NEW)
- Full story narrative display
- User notes section
- Attachments section
- Export buttons
- Edit/refine interface

**File**: `apps/web/app/stories/components/StoryGenerator.tsx` (NEW)
- Trigger manual story generation
- Select period and story type
- Progress indicator during generation

## 5. User Flows

### 5.1 Viewing Stories

1. User navigates to "Stories" tab
2. Sees three cards: Company Story, Banker Story, Investor Story
3. Each card shows:
   - Last generated date
   - Period type (Monthly/Quarterly/Annually)
   - Quick summary preview
4. User taps a card to view full narrative
5. User can add notes, attach files, or export

### 5.2 Auto-Generation Flow

1. System detects period end (month/quarter/year)
2. Triggers story generation for all three types
3. Stories are generated in background
4. User receives notification when stories are ready
5. Stories appear in Stories tab

### 5.3 Export Flow

1. User views a story
2. Clicks "Export" button
3. Selects format (PDF, Shareable Link, Email Format, etc.)
4. System generates formatted export
5. User downloads or shares

## 6. Acceptance Criteria

### 6.1 Story Generation

- [ ] All three story types generate automatically at period end
- [ ] Stories are generated within 5 minutes of period end
- [ ] Stories are accurate and data-driven
- [ ] Each story type has distinct tone and focus
- [ ] Stories reference actual financial data (not generic templates)

### 6.2 Story Quality

- [ ] Company Story focuses on operational clarity
- [ ] Banker Story emphasizes stability and reliability
- [ ] Investor Story highlights growth and opportunity
- [ ] All stories are written in plain English (no accounting jargon)
- [ ] Stories are comprehensive but readable

### 6.3 User Features

- [ ] Users can add notes to stories
- [ ] Users can attach files to stories
- [ ] Users can export stories in multiple formats
- [ ] Users can edit/refine AI-generated narratives
- [ ] Version history tracks changes

### 6.4 Performance

- [ ] Story generation completes within 2 minutes
- [ ] Stories page loads within 1 second
- [ ] Export generation completes within 10 seconds
- [ ] No impact on dashboard performance

## 7. Success Metrics

- **Engagement:** 80%+ of users view at least one story per month
- **Export Rate:** 40%+ of users export at least one story per quarter
- **Retention:** Users who view stories have 2x higher retention
- **User Satisfaction:** Stories rated 4.5+ stars by users
- **Time Saved:** Users report saving 5+ hours per month on report creation

## 8. Out of Scope (Future Enhancements)

- Custom story templates
- Multi-language support
- Collaborative editing (multiple users)
- Real-time story updates (currently batch-generated)
- Story scheduling (custom periods)

## 9. Dependencies

- Phase 1 MVP must be complete (approval system working)
- Approved entries must be in `entries_final` table
- Historical data must be available (minimum 1 month for monthly, 1 quarter for quarterly, 1 year for annually)
- OpenRouter API must be configured
- User must have completed onboarding

## 10. Implementation Timeline

**Sprint 1: Foundation (Weeks 1-2)**
- Create schema and backend functions
- Implement basic story generation for Company Story
- Create Stories page and StoryCard component

**Sprint 2: All Story Types (Weeks 3-4)**
- Implement Banker Story generation
- Implement Investor Story generation
- Create StoryView component
- Add export functionality

**Sprint 3: Polish & Testing (Weeks 5-6)**
- Add user notes and attachments
- Implement version history
- Performance optimization
- End-to-end testing
- User acceptance testing

