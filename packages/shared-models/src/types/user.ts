/**
 * User and business profile types
 */

export type SubscriptionTier = 'solo' | 'professional' | 'growing_business';

export type BusinessType = 
  | 'creator' 
  | 'tradesperson' 
  | 'wellness' 
  | 'tutor' 
  | 'real_estate'
  | 'agency'
  | 'other';

export interface User {
  id: string;
  email: string;
  name?: string;
  businessType?: BusinessType;
  subscriptionTier: SubscriptionTier;
  createdAt: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultCurrency: string;
  fiscalYearStart?: string; // MM-DD format
  aiInsightLevel: 'low' | 'medium' | 'high';
  notificationsEnabled: boolean;
  darkMode?: boolean;
}

export interface Institution {
  id: string;
  userId: string;
  plaidItemId: string;
  plaidInstitutionId: string;
  name: string;
  accessTokenEncrypted: string; // Encrypted Plaid access token
  lastSyncAt?: number;
  syncStatus: 'active' | 'error' | 'disconnected';
  createdAt: number;
}

