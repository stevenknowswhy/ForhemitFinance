/**
 * OpenRouter API integration for AI story generation
 */

/**
 * Call OpenRouter API to generate story narrative
 */
export async function callOpenRouterAPI(
  prompt: string,
  systemPrompt: string,
  model: string = "x-ai/grok-4.1-fast:free"
): Promise<{
  narrative: string;
  summary: string;
  keyMetrics: Record<string, any>;
  insight?: string;
}> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterApiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_REFERRER || "https://ezfinancial.app",
      "X-Title": "EZ Financial AI Stories",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  try {
    const parsed = JSON.parse(content);
    return {
      narrative: parsed.narrative || "",
      summary: parsed.summary || "",
      keyMetrics: parsed.keyMetrics || {},
      insight: parsed.insight || "",
    };
  } catch (e) {
    // Fallback: treat entire response as narrative
    return {
      narrative: content,
      summary: content.substring(0, 200) + "...",
      keyMetrics: {},
      insight: "",
    };
  }
}

