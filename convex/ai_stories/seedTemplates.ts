import { internalMutation } from "../_generated/server";
import { STORY_SYSTEM_PROMPTS } from "./prompts";

export const seedTemplates = internalMutation({
    args: {},
    handler: async (ctx) => {
        const templates = [
            {
                slug: "company-monthly",
                title: "Company Story",
                subtitle: "Internal compass - burn rate, trends, cash runway",
                storyType: "company",
                periodType: "monthly",
                role: "Chief Financial Officer",
                focuses: ["Burn rate", "Cash runway", "Revenue trends", "Expense management"],
                systemPrompt: STORY_SYSTEM_PROMPTS.company.monthly,
                order: 1,
            },
            {
                slug: "company-quarterly",
                title: "Company Story",
                subtitle: "Internal compass - burn rate, trends, cash runway",
                storyType: "company",
                periodType: "quarterly",
                role: "Chief Financial Officer",
                focuses: ["Burn rate", "Cash runway", "Revenue trends", "Expense management"],
                systemPrompt: STORY_SYSTEM_PROMPTS.company.quarterly,
                order: 2,
            },
            {
                slug: "banker-monthly",
                title: "Banker Story",
                subtitle: "Financial credibility - debt ratios, cash flow reliability",
                storyType: "banker",
                periodType: "monthly",
                role: "Credit Risk Analyst",
                focuses: ["Debt ratios", "Liquidity", "Cash flow reliability", "Risk assessment"],
                systemPrompt: STORY_SYSTEM_PROMPTS.banker.monthly,
                order: 3,
            },
            {
                slug: "banker-quarterly",
                title: "Banker Story",
                subtitle: "Financial credibility - debt ratios, cash flow reliability",
                storyType: "banker",
                periodType: "quarterly",
                role: "Credit Risk Analyst",
                focuses: ["Debt ratios", "Liquidity", "Cash flow reliability", "Risk assessment"],
                systemPrompt: STORY_SYSTEM_PROMPTS.banker.quarterly,
                order: 4,
            },
            {
                slug: "investor-monthly",
                title: "Investor Story",
                subtitle: "Growth thesis - revenue efficiency, 12-24 month outlook",
                storyType: "investor",
                periodType: "monthly",
                role: "Venture Capital Investment Partner",
                focuses: ["Growth rate", "Unit economics", "LTV:CAC", "Scaling potential"],
                systemPrompt: STORY_SYSTEM_PROMPTS.investor.monthly,
                order: 5,
            },
            {
                slug: "investor-quarterly",
                title: "Investor Story",
                subtitle: "Growth thesis - revenue efficiency, 12-24 month outlook",
                storyType: "investor",
                periodType: "quarterly",
                role: "Venture Capital Investment Partner",
                focuses: ["Growth rate", "Unit economics", "LTV:CAC", "Scaling potential"],
                systemPrompt: STORY_SYSTEM_PROMPTS.investor.quarterly,
                order: 6,
            },
        ];

        let count = 0;
        for (const template of templates) {
            const existing = await ctx.db
                .query("story_templates")
                .filter((q) => q.eq(q.field("slug"), template.slug))
                .first();

            if (!existing) {
                await ctx.db.insert("story_templates", {
                    slug: template.slug,
                    title: template.title,
                    subtitle: template.subtitle,
                    storyType: template.storyType as any,
                    periodType: template.periodType as any,
                    role: template.role,
                    focuses: template.focuses,
                    systemPrompt: template.systemPrompt,
                    dataRequirements: [], // Default empty
                    isActive: true,
                    order: template.order,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                count++;
            }
        }

        return `Seeded ${count} templates.`;
    },
});
