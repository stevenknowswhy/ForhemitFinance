/**
 * Tool: shadcn_init
 * 
 * Initializes shadcn/ui in a project.
 */

import { z } from "zod";
import { writeComponentsConfig, DEFAULT_CONFIG } from "../file-system/config-manager.js";
import { generateUtilsFile } from "../file-system/generator.js";
import { getUtilsPath, getTailwindConfigPath } from "../utils/path-resolver.js";
import { installPackages } from "../utils/package-manager.js";
import { logger } from "../utils/logger.js";
import { readFile, writeFile } from "fs/promises";

const InitArgsSchema = z.object({
  projectPath: z.string(),
  style: z.enum(["default", "new-york"]).optional(),
  baseColor: z
    .enum(["slate", "gray", "zinc", "neutral", "stone"])
    .optional(),
  cssVariables: z.boolean().optional(),
  tailwindConfigPath: z.string().optional(),
  componentsPath: z.string().optional(),
  utilsPath: z.string().optional(),
});

type InitArgs = z.infer<typeof InitArgsSchema>;

/**
 * Updates Tailwind config with shadcn/ui theme
 */
async function updateTailwindConfig(projectPath: string): Promise<boolean> {
  const configPath = getTailwindConfigPath(projectPath);
  
  if (!configPath) {
    logger.warn("No tailwind.config.js found, skipping Tailwind update");
    return false;
  }

  try {
    let content = await readFile(configPath, "utf-8");
    
    // Check if already configured
    if (content.includes("shadcn/ui") || content.includes("cssVariables")) {
      logger.info("Tailwind config already includes shadcn/ui settings");
      return true;
    }

    // Add theme configuration
    const themeConfig = `
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },`;

    // Try to insert into existing config
    if (content.includes("theme:")) {
      // Replace existing theme.extend or add to theme
      content = content.replace(
        /theme:\s*\{[^}]*\}/s,
        `theme: {${themeConfig}\n    }`
      );
    } else {
      // Add theme to module.exports
      content = content.replace(
        /module\.exports\s*=\s*\{/,
        `module.exports = {${themeConfig}`
      );
    }

    await writeFile(configPath, content);
    logger.info("Updated Tailwind config");
    return true;
  } catch (error) {
    logger.error("Failed to update Tailwind config:", error);
    return false;
  }
}

/**
 * Initializes shadcn/ui in a project
 */
export async function init(args: unknown): Promise<{
  success: boolean;
  componentsJsonPath: string;
  tailwindConfigUpdated: boolean;
  dependenciesInstalled: string[];
  message: string;
}> {
  // Validate arguments
  const validatedArgs = InitArgsSchema.parse(args);
  const {
    projectPath,
    style = "default",
    baseColor = "slate",
    cssVariables = true,
    componentsPath,
    utilsPath,
  } = validatedArgs;

  logger.info("Initializing shadcn/ui in project:", projectPath);

  try {
    // 1. Create components.json
    const componentsJsonPath = await writeComponentsConfig(projectPath, {
      style,
      tailwind: {
        ...DEFAULT_CONFIG.tailwind,
        baseColor,
        cssVariables,
      },
      aliases: {
        ...DEFAULT_CONFIG.aliases,
        ...(componentsPath && { components: componentsPath }),
        ...(utilsPath && { utils: utilsPath }),
      },
    });

    // 2. Generate utils file
    const resolvedUtilsPath = getUtilsPath(projectPath, utilsPath);
    await generateUtilsFile(resolvedUtilsPath);

    // 3. Update Tailwind config
    const tailwindConfigUpdated = await updateTailwindConfig(projectPath);

    // 4. Install base dependencies
    const baseDependencies = [
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ];
    
    await installPackages(projectPath, baseDependencies);

    return {
      success: true,
      componentsJsonPath,
      tailwindConfigUpdated,
      dependenciesInstalled: baseDependencies,
      message: "shadcn/ui initialized successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error("Failed to initialize shadcn/ui:", errorMessage);
    throw new Error(`Failed to initialize: ${errorMessage}`);
  }
}

