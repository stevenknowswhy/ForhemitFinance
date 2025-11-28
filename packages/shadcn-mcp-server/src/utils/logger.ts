/**
 * Simple logger utility for the MCP server
 */

export const logger = {
  info: (...args: any[]) => {
    console.error("[INFO]", ...args);
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  },
  warn: (...args: any[]) => {
    console.error("[WARN]", ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.DEBUG) {
      console.error("[DEBUG]", ...args);
    }
  },
};

