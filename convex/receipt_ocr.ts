/**
 * Receipt OCR processing using OpenRouter with Google Gemini 3 Pro Preview
 * Extracts structured data from receipt images
 */

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

interface ReceiptOCRData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  tax?: number;
  tip?: number;
  paymentMethod?: string;
  confidence: number;
}

/**
 * Process receipt image using OpenRouter with Gemini 3 Pro Preview vision model
 */
export const processReceiptOCR = action({
  args: {
    receiptUrl: v.string(),
    receiptId: v.optional(v.id("receipts")),
  },
  handler: async (ctx, args) => {
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    try {
      // Build prompt for receipt OCR
      const prompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "store or business name",
  "amount": total amount as number,
  "date": "date in YYYY-MM-DD format",
  "items": [
    {
      "description": "item name",
      "amount": price as number,
      "quantity": quantity as number (if available)
    }
  ],
  "tax": tax amount as number (if available),
  "tip": tip amount as number (if available),
  "paymentMethod": "last 4 digits of card or payment method if visible"
}

Be precise with amounts and dates. If you cannot determine a field, omit it from the JSON. Return ONLY valid JSON, no other text.`;

      // Use Gemini 3 Pro Preview for vision
      const model = "google/gemini-3-pro-preview";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ez-financial.app",
          "X-Title": "EZ Financial",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: args.receiptUrl,
                  },
                },
              ],
            },
          ],
          temperature: 0.1, // Low temperature for accuracy
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("No content returned from OCR");
      }

      // Parse JSON response
      let ocrData: ReceiptOCRData;
      try {
        // Extract JSON from response (might have markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : content;
        ocrData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse OCR JSON:", content);
        throw new Error("Failed to parse OCR response as JSON");
      }

      // Validate and normalize the data
      const normalizedData: ReceiptOCRData = {
        merchant: ocrData.merchant?.trim(),
        amount: ocrData.amount ? parseFloat(String(ocrData.amount)) : undefined,
        date: ocrData.date?.trim(),
        items: ocrData.items?.map((item: any) => ({
          description: item.description?.trim() || "",
          amount: parseFloat(String(item.amount || 0)),
          quantity: item.quantity ? parseFloat(String(item.quantity)) : undefined,
        })),
        tax: ocrData.tax ? parseFloat(String(ocrData.tax)) : undefined,
        tip: ocrData.tip ? parseFloat(String(ocrData.tip)) : undefined,
        paymentMethod: ocrData.paymentMethod?.trim(),
        confidence: 0.85, // Default confidence for Gemini 3 Pro
      };

      // Calculate confidence based on extracted fields
      let confidenceScore = 0.85;
      if (normalizedData.amount && normalizedData.merchant && normalizedData.date) {
        confidenceScore = 0.95;
      } else if (normalizedData.amount && normalizedData.merchant) {
        confidenceScore = 0.90;
      } else if (normalizedData.amount) {
        confidenceScore = 0.80;
      }

      normalizedData.confidence = confidenceScore;

      // Update receipt with OCR data if receiptId provided
      if (args.receiptId) {
        await ctx.runMutation(internal.receipt_ocr.updateReceiptOCR, {
          receiptId: args.receiptId,
          ocrData: normalizedData,
        });
      }

      return {
        success: true,
        ocrData: normalizedData,
      };
    } catch (error: any) {
      console.error("Receipt OCR processing failed:", error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  },
});

/**
 * Internal mutation to update receipt with OCR data
 * Called from processReceiptOCR action
 */
export const updateReceiptOCR = internalMutation({
  args: {
    receiptId: v.id("receipts"),
    ocrData: v.any(),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receiptId);
    if (receipt) {
      await ctx.db.patch(args.receiptId, {
        ocrData: args.ocrData,
      });
    }
  },
});

