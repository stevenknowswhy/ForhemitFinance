"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg border border-border bg-background text-foreground"
        aria-label="Theme toggle"
        disabled
      >
        <Monitor className="w-5 h-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") {
      return <Sun className="w-5 h-5" />;
    } else if (theme === "dark") {
      return <Moon className="w-5 h-5" />;
    } else {
      return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    if (theme === "light") {
      return "Light mode (click for dark)";
    } else if (theme === "dark") {
      return "Dark mode (click for system)";
    } else {
      return "System preference (click for light)";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "p-2 rounded-lg border border-border bg-background text-foreground",
        "hover:bg-muted transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "active:scale-95"
      )}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}

