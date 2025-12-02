import { cn } from "@/lib/utils";
import { Briefcase, User, Layers } from "lucide-react";

export type FilterType = "all" | "business" | "personal";

interface FilterPillsProps {
    value: FilterType;
    onChange: (value: FilterType) => void;
    className?: string;
}

export function FilterPills({ value, onChange, className }: FilterPillsProps) {
    return (
        <div className={cn("flex items-center bg-muted/50 p-1 rounded-lg border border-border", className)}>
            <button
                onClick={() => onChange("all")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    value === "all"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
            >
                <Layers className="w-4 h-4" />
                All
            </button>
            <button
                onClick={() => onChange("business")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    value === "business"
                        ? "bg-background text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
            >
                <Briefcase className="w-4 h-4" />
                Business
            </button>
            <button
                onClick={() => onChange("personal")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    value === "personal"
                        ? "bg-background text-purple-600 dark:text-purple-400 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
            >
                <User className="w-4 h-4" />
                Personal
            </button>
        </div>
    );
}
