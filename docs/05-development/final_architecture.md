# Final Architecture: Core Product + Marketplace Add-Ons

## 1. High-Level Strategy
To achieve the goal of a **Radically Simple Core** with **Optional Superpower Add-ons**, we will enforce a strict separation of concerns in the Data, API, and UI layers.

*   **Core**: Monolithic, highly integrated, "batteries included".
*   **Add-ons**: Modular, decoupled, "plug-in" architecture.

---

## 2. Database Schema (Convex)

We categorize tables into **Core**, **Marketplace Infrastructure**, and **Domain Modules**.

### A. Core Tables (Included for Everyone)
These tables drive the `transactions`, `dashboard`, and `settings` pages.
*   `users`: Identity & Preferences.
*   `organizations`: Multi-tenant logic.
*   `accounts`: Chart of Accounts & Bank Feeds.
*   `transactions`: The central ledger (Expenses/Income).
*   `mileage`: (New) Mileage tracking.
*   `invoices`: (New) Simple invoicing.
*   `budgets`: Basic budgeting limits.
*   `ai_insights`: Generative AI outputs (Stories, Feed).

### B. Marketplace Infrastructure (The Registry)
These tables manage the "App Store" capabilities.
*   `addons`: The Registry. Definition of available modules (Name, Slug, Stripe Price ID, Category).
*   `org_addons`: Entitlements. Records of **purchase/ownership** (Org ID + Addon ID + Status + Expiry).
*   `module_enablements`: Feature Toggles. User-controlled **On/Off switch** for owned modules (Org ID + Module Slug + Enabled: boolean).

### C. Modular Add-On Tables (Domain Specific)
Each add-on introduces its own data models.
*   **Project Profitability**: `projects`, `project_budgets`.
*   **Time Tracking**: `time_entries`, `rates`.
*   **Contractors**: `contractors`, `contractor_payments`, `1099_forms`.
*   **Workflow**: `automations`, `triggers`, `actions`.

---

## 3. API Routes (Convex)

We will group API functions to mirror the schema separation.

```
convex/
├── _generated/
├── schema.ts            <-- Single definition (Best for type safety in Convex)
├── auth.ts              <-- Core Auth
├── transactions.ts      <-- Core Ledger
├── mileage.ts           <-- Core Mileage
├── invoices.ts          <-- Core Invoicing
├── marketplace/         <-- Marketplace Logic
│   ├── registry.ts      <-- List addons
│   ├── entitlements.ts  <-- Check permissions
│   └── webhooks.ts      <-- Stripe sync
└── modules/             <-- Add-on Domains
    ├── projects/
    │   └── main.ts
    ├── time_tracking/
    │   └── main.ts
    └── workflows/
        └── engine.ts
```

---

## 4. UI Component Architecture (Domain Driven)

The frontend will use a **Feature-First** directory structure.

```
apps/web/app/
├── (core)/              <-- Core Routes (No URL prefix or simple /app)
│   ├── dashboard/
│   ├── transactions/
│   ├── mileage/
│   └── invoices/
├── (marketplace)/       <-- Marketplace UI
│   ├── marketplace/     <-- The "App Store"
│   └── settings/billing <-- Managing subs & add-ons
└── modules/             <-- Add-on Routes (Lazy loaded sections)
    ├── projects/
    ├── time-tracking/
    └── contractors/
```

### Bloat Prevention Strategy: "Slot Pattern"
To keep Core simple, it should **not** import Add-on components directly. Instead, we use a `ModuleSlot` architecture.

**Example**:
The Transaction Detail View has a specific "Add-on Slot".
*   If `Project Profitability` is enabled, the slot renders a `<ProjectSelector />`.
*   If not, the slot renders nothing.

This prevents the Core UI from becoming cluttered with `if (projects) ... if (time) ...` logic.

---

## 5. Feature Entitlement & Enforcement

We enforce entitlements at **Both** the API and UI layers.

### API Layer (Security)
Every Add-on mutation/query must explicitly check:
1.  Is the Org **entitled** to this addon? (Purchased/Trialing)
2.  Is the addon **enabled**? (Turned on by Admin)

**Pattern**:
```typescript
// convex/modules/projects/main.ts
export const createProject = mutation({
  handler: async (ctx, args) => {
    // 1. Core Auth
    const user = await getAuthUser(ctx);
    // 2. Entitlement Guard
    await requireAddon(ctx, user.orgId, "project_profitability");
    
    // ... logic ...
  }
});
```

### UI Layer (UX)
Use a React Context `<FeatureProvider>` to expose enabled modules globally.

```tsx
// Feature Guard Component
<RequireFeature feature="project_profitability" fallback={<UpgradePrompt />}>
  <ProjectDashboard />
</RequireFeature>
```

---

## 6. Marketplace Workflow

1.  **Discovery**: User visits `/marketplace`. Sees available modules.
2.  **Purchase**:
    *   User clicks "Buy/Trial".
    *   App calls `api.marketplace.checkout.createSession`.
    *   Redirects to **Stripe Checkout**.
3.  **Provisioning (Webhook)**:
    *   Stripe `checkout.session.completed` -> Convex `httpAction`.
    *   Convex updates `org_addons` (status: 'active').
    *   Convex updates `module_enablements` (enabled: true).
4.  **Usage**:
    *   User is redirected back to App.
    *   `FeatureProvider` updates state.
    *   New Navigation Items appear (e.g., "Projects" in sidebar).

---

## 7. AI Integration Strategy

*   **Core AI (`ai_insights`)**:
    *   **Goal**: Zero-config "Financial Health".
    *   **Implementation**: Scheduled cron jobs run standard analyzers (Cash Flow, Burn Rate) and write to `ai_insights` table.
    *   **UI**: Simple "Feed" cards on Dashboard.

*   **Add-on AI (`finance_agents`)**:
    *   **Goal**: On-demand, complex modeling.
    *   **Implementation**: Context-aware agents.
    *   **Mechanism**: These are **Convex Actions** (serverless functions) calling LLMs with broader context (e.g., "Read all 1099s and optimize tax").
    *   **Cost**: Billed as an add-on due to higher token usage.

---

## 8. Summary: Simplicity vs. Power

| Dimension | Core Product | Add-Ons |
| :--- | :--- | :--- |
| **Philosophy** | "It just works" | "Power for Pros" |
| **Navigation** | Top-level, Fixed | Dynamic, opt-in |
| **API** | Direct DB queries | Guarded Logic |
| **Cost** | Base Subscription | Per-module / Usage |
| **Bloat Control** | Minimal Config | Isolated Modules |
