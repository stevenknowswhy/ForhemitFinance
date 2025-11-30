/**
 * Split transaction suggestions
 * Suggests how to split large transactions into multiple categories
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

interface SplitSuggestion {
  description: string;
  category: string;
  amount: number;
  confidence: number;
}

/**
 * Suggest how to split a transaction based on:
 * - Receipt line items (if available)
 * - Past behavior for same vendor
 * - Category patterns
 */
export const suggestSplit = action({
  args: {
    merchant: v.string(),
    amount: v.number(),
    receiptItems: v.optional(v.array(v.object({
      description: v.string(),
      amount: v.number(),
      quantity: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    // Get user ID from auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }
    const amount = Math.abs(args.amount);
    
    // If receipt items are provided, use them directly
    if (args.receiptItems && args.receiptItems.length > 0) {
      const suggestions: SplitSuggestion[] = args.receiptItems.map((item: any) => ({
        description: item.description,
        category: inferCategoryFromDescription(item.description),
        amount: item.amount,
        confidence: 0.90, // High confidence when from receipt
      }));
      
      return { suggestions };
    }
    
    // Otherwise, use AI to suggest splits based on vendor and amount
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      // Fallback: suggest common splits
      return {
        suggestions: [
          {
            description: "Main purchase",
            category: inferCategoryFromDescription(args.merchant),
            amount: amount * 0.7,
            confidence: 0.60,
          },
          {
            description: "Other items",
            category: "Other",
            amount: amount * 0.3,
            confidence: 0.60,
          },
        ],
      };
    }

    try {
      const prompt = `A user is entering a transaction for $${amount.toFixed(2)} at ${args.merchant}.

Suggest how to split this transaction into 2-4 categories with estimated amounts. Consider:
- Common purchase patterns for this merchant
- Typical item categories
- Reasonable amount distributions

Return ONLY a JSON array of objects with this format:
[
  {
    "description": "brief item description",
    "category": "category name",
    "amount": estimated amount as number
  }
]

The amounts should sum to approximately $${amount.toFixed(2)}.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ez-financial.app",
          "X-Title": "EZ Financial",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("No content returned");
      }

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonText);

      const suggestions: SplitSuggestion[] = parsed.map((item: any) => ({
        description: item.description || "Item",
        category: item.category || inferCategoryFromDescription(args.merchant),
        amount: parseFloat(String(item.amount || 0)),
        confidence: 0.75,
      }));

      // Normalize amounts to sum to total
      const total = suggestions.reduce((sum, s) => sum + s.amount, 0);
      if (total > 0) {
        const ratio = amount / total;
        suggestions.forEach(s => {
          s.amount = s.amount * ratio;
        });
      }

      return { suggestions };
    } catch (error: any) {
      console.error("Split suggestion failed:", error);
      // Fallback
      return {
        suggestions: [
          {
            description: "Main purchase",
            category: inferCategoryFromDescription(args.merchant),
            amount: amount * 0.7,
            confidence: 0.60,
          },
          {
            description: "Other items",
            category: "Other",
            amount: amount * 0.3,
            confidence: 0.60,
          },
        ],
      };
    }
  },
});

function inferCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes("food") || desc.includes("restaurant") || desc.includes("coffee") || desc.includes("starbucks")) {
    return "Food & Drinks";
  }
  if (desc.includes("office") || desc.includes("supplies")) {
    return "Office Supplies";
  }
  if (desc.includes("travel") || desc.includes("uber") || desc.includes("gas")) {
    return "Travel";
  }
  if (desc.includes("software") || desc.includes("subscription")) {
    return "Software";
  }
  if (desc.includes("amazon") || desc.includes("target") || desc.includes("walmart")) {
    return "Shopping";
  }
  
  return "Other";
}

