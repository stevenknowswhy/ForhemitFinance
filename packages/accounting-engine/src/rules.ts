/**
 * Rule-based categorization system
 * Handles merchant mappings, category rules, and user-defined patterns
 */

export interface CategorizationRule {
  id: string;
  name: string;
  type: 'merchant' | 'category' | 'pattern' | 'amount_range';
  pattern: string | RegExp;
  accountId: string;
  isBusiness: boolean;
  priority: number; // Higher priority = checked first
}

/**
 * Default categorization rules for common merchants and patterns
 */
export const DEFAULT_RULES: CategorizationRule[] = [
  {
    id: 'starbucks-business',
    name: 'Starbucks - Business',
    type: 'merchant',
    pattern: /starbucks/i,
    accountId: 'meals-entertainment', // Will be resolved to actual account ID
    isBusiness: true,
    priority: 10,
  },
  {
    id: 'amazon-office',
    name: 'Amazon - Office Supplies',
    type: 'merchant',
    pattern: /amazon/i,
    accountId: 'office-supplies',
    isBusiness: true,
    priority: 5,
  },
  {
    id: 'gas-stations',
    name: 'Gas Stations',
    type: 'category',
    pattern: /gas_stations|fuel/i,
    accountId: 'vehicle-expenses',
    isBusiness: true,
    priority: 8,
  },
];

/**
 * Match a transaction against categorization rules
 */
export function matchRule(
  merchant: string | undefined,
  category: string[] | undefined,
  description: string,
  rules: CategorizationRule[]
): CategorizationRule | null {
  // Sort by priority (highest first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (matchesRule(merchant, category, description, rule)) {
      return rule;
    }
  }

  return null;
}

function matchesRule(
  merchant: string | undefined,
  category: string[] | undefined,
  description: string,
  rule: CategorizationRule
): boolean {
  const pattern = typeof rule.pattern === 'string' 
    ? new RegExp(rule.pattern, 'i')
    : rule.pattern;

  switch (rule.type) {
    case 'merchant':
      return merchant ? pattern.test(merchant) : false;
    
    case 'category':
      if (!category) return false;
      return category.some(cat => pattern.test(cat));
    
    case 'pattern':
      return pattern.test(description) || (merchant ? pattern.test(merchant) : false);
    
    case 'amount_range':
      // Would need amount passed in - simplified for now
      return false;
    
    default:
      return false;
  }
}

