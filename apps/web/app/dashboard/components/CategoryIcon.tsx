"use client";

/**
 * CategoryIcon Component
 * Maps category names to emoji/icons for visual scanning
 */

export function getCategoryIcon(category: string): string {
  if (!category) return "📋";
  
  const normalized = category.toLowerCase().trim();
  
  // Food & Dining
  if (normalized.includes("food") || normalized.includes("restaurant") || normalized.includes("dining") || 
      normalized.includes("cafe") || normalized.includes("coffee") || normalized.includes("starbucks") ||
      normalized.includes("meal") || normalized.includes("lunch") || normalized.includes("dinner") ||
      normalized.includes("breakfast") || normalized.includes("snack")) {
    return "🍽️";
  }
  
  // Drinks
  if (normalized.includes("drink") || normalized.includes("beverage") || normalized.includes("bar")) {
    return "☕";
  }
  
  // Office Supplies
  if (normalized.includes("office") || normalized.includes("supplies") || normalized.includes("stationery") ||
      normalized.includes("paper") || normalized.includes("pen") || normalized.includes("printer")) {
    return "📦";
  }
  
  // Travel & Transportation
  if (normalized.includes("travel") || normalized.includes("transport") || normalized.includes("uber") ||
      normalized.includes("lyft") || normalized.includes("taxi") || normalized.includes("gas") ||
      normalized.includes("fuel") || normalized.includes("parking") || normalized.includes("flight") ||
      normalized.includes("hotel") || normalized.includes("airbnb")) {
    return "✈️";
  }
  
  // Software & Subscriptions
  if (normalized.includes("software") || normalized.includes("subscription") || normalized.includes("saas") ||
      normalized.includes("app") || normalized.includes("service") || normalized.includes("cloud") ||
      normalized.includes("aws") || normalized.includes("azure") || normalized.includes("gcp")) {
    return "💻";
  }
  
  // Utilities
  if (normalized.includes("utility") || normalized.includes("electric") || normalized.includes("water") ||
      normalized.includes("internet") || normalized.includes("phone") || normalized.includes("cable") ||
      normalized.includes("utility bill")) {
    return "⚡";
  }
  
  // Shopping & Retail
  if (normalized.includes("shopping") || normalized.includes("retail") || normalized.includes("store") ||
      normalized.includes("amazon") || normalized.includes("target") || normalized.includes("walmart")) {
    return "🛒";
  }
  
  // Entertainment
  if (normalized.includes("entertainment") || normalized.includes("movie") || normalized.includes("netflix") ||
      normalized.includes("spotify") || normalized.includes("music") || normalized.includes("game")) {
    return "🎬";
  }
  
  // Health & Fitness
  if (normalized.includes("health") || normalized.includes("medical") || normalized.includes("doctor") ||
      normalized.includes("pharmacy") || normalized.includes("gym") || normalized.includes("fitness")) {
    return "🏥";
  }
  
  // Education
  if (normalized.includes("education") || normalized.includes("course") || normalized.includes("training") ||
      normalized.includes("book") || normalized.includes("learning")) {
    return "📚";
  }
  
  // Marketing & Advertising
  if (normalized.includes("marketing") || normalized.includes("advertising") || normalized.includes("ad") ||
      normalized.includes("promotion") || normalized.includes("social media")) {
    return "📢";
  }
  
  // Professional Services
  if (normalized.includes("legal") || normalized.includes("lawyer") || normalized.includes("accountant") ||
      normalized.includes("consultant") || normalized.includes("professional")) {
    return "💼";
  }
  
  // Rent & Real Estate
  if (normalized.includes("rent") || normalized.includes("lease") || normalized.includes("real estate") ||
      normalized.includes("property")) {
    return "🏠";
  }
  
  // Insurance
  if (normalized.includes("insurance")) {
    return "🛡️";
  }
  
  // Income/Revenue
  if (normalized.includes("income") || normalized.includes("revenue") || normalized.includes("salary") ||
      normalized.includes("payment") || normalized.includes("invoice")) {
    return "💰";
  }
  
  // Default
  return "📋";
}

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  return (
    <span className={className} role="img" aria-label={category}>
      {getCategoryIcon(category)}
    </span>
  );
}

