/**
 * Top Categories List Component
 */

"use client";

interface TopCategoriesListProps {
  title: string;
  categories: Array<{ category: string; amount: number }>;
  totalSpent: number;
}

export function TopCategoriesList({ title, categories, totalSpent }: TopCategoriesListProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-card rounded-lg shadow border border-border p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground">{title}</h3>
      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-medium text-foreground">{cat.category}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${(cat.amount / totalSpent) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="font-bold ml-4 text-foreground">${cat.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

