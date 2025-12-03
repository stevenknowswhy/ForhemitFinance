/**
 * Unit tests for module entitlements
 */

import { describe, it, expect } from "vitest";
import {
  planIncludesModule,
  getModulesForPlan,
  getModulesToEnableOnUpgrade,
  getModulesToDisableOnDowngrade,
  isModulePaid,
} from "../../../convex/module-entitlements";

describe("Module Entitlements", () => {
  it("should check if plan includes a module", () => {
    expect(planIncludesModule("solo", "reports")).toBe(true);
    expect(planIncludesModule("solo", "stories")).toBe(false);
    expect(planIncludesModule("light", "stories")).toBe(true);
    expect(planIncludesModule("pro", "stories")).toBe(true);
  });

  it("should get all modules for a plan", () => {
    const soloModules = getModulesForPlan("solo");
    expect(soloModules).toContain("reports");
    expect(soloModules).not.toContain("stories");

    const lightModules = getModulesForPlan("light");
    expect(lightModules).toContain("reports");
    expect(lightModules).toContain("stories");

    const proModules = getModulesForPlan("pro");
    expect(proModules).toContain("reports");
    expect(proModules).toContain("stories");
  });

  it("should get modules to enable on upgrade", () => {
    const modules = getModulesToEnableOnUpgrade("solo", "light");
    expect(modules).toContain("stories");
    expect(modules).not.toContain("reports"); // Already in solo

    const proModules = getModulesToEnableOnUpgrade("light", "pro");
    // Currently pro has same modules as light, so should be empty
    expect(proModules).toEqual([]);
  });

  it("should get modules to disable on downgrade", () => {
    const modules = getModulesToDisableOnDowngrade("light", "solo");
    expect(modules).toContain("stories");
    expect(modules).not.toContain("reports"); // Still in solo
  });

  it("should check if module is paid", () => {
    expect(isModulePaid("reports")).toBe(false); // Free
    expect(isModulePaid("stories")).toBe(true); // Paid (not in solo)
  });
});

