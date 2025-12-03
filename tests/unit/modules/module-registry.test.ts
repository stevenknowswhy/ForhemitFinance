/**
 * Unit tests for module registry
 */

import { describe, it, expect, beforeEach } from "vitest";
import { moduleRegistry, registerModule } from "../../../modules/core/module-registry";
import { ModuleManifest } from "../../../modules/core/types";
import { BookOpen, FileText } from "lucide-react";

describe("Module Registry", () => {
  beforeEach(() => {
    // Clear registry before each test
    (moduleRegistry as any).modules.clear();
  });

  it("should register a module", () => {
    const manifest: ModuleManifest = {
      id: "test-module",
      version: "1.0.0",
      name: "Test Module",
      description: "A test module",
      billing: { type: "free" },
    };

    registerModule(manifest);
    const retrieved = moduleRegistry.getModuleManifest("test-module");

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("test-module");
    expect(retrieved?.name).toBe("Test Module");
  });

  it("should get all registered modules", () => {
    const manifest1: ModuleManifest = {
      id: "module1",
      version: "1.0.0",
      name: "Module 1",
      description: "First module",
      billing: { type: "free" },
    };

    const manifest2: ModuleManifest = {
      id: "module2",
      version: "1.0.0",
      name: "Module 2",
      description: "Second module",
      billing: { type: "free" },
    };

    registerModule(manifest1);
    registerModule(manifest2);

    const allModules = moduleRegistry.getAllModules();
    expect(allModules).toHaveLength(2);
    expect(allModules.map(m => m.id)).toContain("module1");
    expect(allModules.map(m => m.id)).toContain("module2");
  });

  it("should resolve module dependencies", () => {
    const depManifest: ModuleManifest = {
      id: "dependency",
      version: "1.0.0",
      name: "Dependency",
      description: "A dependency module",
      billing: { type: "free" },
    };

    const mainManifest: ModuleManifest = {
      id: "main",
      version: "1.0.0",
      name: "Main Module",
      description: "Main module with dependency",
      billing: { type: "free" },
      dependencies: [{ moduleId: "dependency" }],
    };

    registerModule(depManifest);
    registerModule(mainManifest);

    const dependencies = moduleRegistry.resolveDependencies("main");
    expect(dependencies).toContain("dependency");
  });

  it("should get modules that depend on a given module", () => {
    const baseManifest: ModuleManifest = {
      id: "base",
      version: "1.0.0",
      name: "Base Module",
      description: "Base module",
      billing: { type: "free" },
    };

    const dependentManifest: ModuleManifest = {
      id: "dependent",
      version: "1.0.0",
      name: "Dependent Module",
      description: "Depends on base",
      billing: { type: "free" },
      dependencies: [{ moduleId: "base" }],
    };

    registerModule(baseManifest);
    registerModule(dependentManifest);

    const dependents = moduleRegistry.getDependentModules("base");
    expect(dependents).toContain("dependent");
  });
});

