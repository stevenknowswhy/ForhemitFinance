/**
 * Unit tests for list-components tool
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { listComponents } from "./list-components.js";

// Mock fetch
global.fetch = vi.fn();

describe("listComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return components from registry", async () => {
    // Mock GitHub API response for registry index
    const mockRegistryResponse = [
      { name: "button", type: "dir" },
      { name: "card", type: "dir" },
      { name: "_internal", type: "dir" }, // Should be filtered out
    ];

    // Mock meta.json responses
    const mockButtonMeta = {
      name: "button",
      description: "Button component",
      category: "forms",
      dependencies: ["@radix-ui/react-slot"],
      files: ["button.tsx"],
    };

    const mockCardMeta = {
      name: "card",
      description: "Card component",
      category: "display",
      dependencies: [],
      files: ["card.tsx"],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockButtonMeta,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardMeta,
      });

    const result = await listComponents({});

    expect(result.components).toHaveLength(2);
    expect(result.components[0].name).toBe("button");
    expect(result.components[1].name).toBe("card");
  });

  it("should filter components by category", async () => {
    const mockRegistryResponse = [
      { name: "button", type: "dir" },
      { name: "card", type: "dir" },
    ];

    const mockButtonMeta = {
      name: "button",
      description: "Button component",
      category: "forms",
      dependencies: [],
      files: [],
    };

    const mockCardMeta = {
      name: "card",
      description: "Card component",
      category: "display",
      dependencies: [],
      files: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockButtonMeta,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardMeta,
      });

    const result = await listComponents({ category: "forms" });

    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("button");
    expect(result.components[0].category).toBe("forms");
  });

  it("should handle missing metadata gracefully", async () => {
    const mockRegistryResponse = [{ name: "unknown", type: "dir" }];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

    const result = await listComponents({});

    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("unknown");
    expect(result.components[0].category).toBe("uncategorized");
  });
});

