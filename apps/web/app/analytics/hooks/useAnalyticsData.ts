/**
 * Hook for calculating analytics data from transactions
 */

import { useMemo } from "react";
import type { AnalyticsData } from "../types";

export function useBusinessAnalytics(
  businessTransactions: any[],
  allAnalytics: any
): AnalyticsData | null {
  return useMemo(() => {
    if (!allAnalytics || !businessTransactions || businessTransactions.length === 0) return null;
    
    const businessTotalSpent = businessTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const businessTotalIncome = businessTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const byCategory: Record<string, number> = {};
    businessTransactions.forEach((t: any) => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      totalSpent: Math.round(businessTotalSpent * 100) / 100,
      totalIncome: Math.round(businessTotalIncome * 100) / 100,
      netCashFlow: Math.round((businessTotalIncome - businessTotalSpent) * 100) / 100,
      transactionCount: businessTransactions.length,
      topCategories,
      averageDailySpending: Math.round((businessTotalSpent / 30) * 100) / 100,
    };
  }, [businessTransactions, allAnalytics]);
}

export function usePersonalAnalytics(
  personalTransactions: any[],
  allAnalytics: any
): AnalyticsData | null {
  return useMemo(() => {
    if (!allAnalytics || !personalTransactions || personalTransactions.length === 0) return null;
    
    const personalTotalSpent = personalTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const personalTotalIncome = personalTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const byCategory: Record<string, number> = {};
    personalTransactions.forEach((t: any) => {
      if (t.amount < 0) {
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
      }
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      totalSpent: Math.round(personalTotalSpent * 100) / 100,
      totalIncome: Math.round(personalTotalIncome * 100) / 100,
      netCashFlow: Math.round((personalTotalIncome - personalTotalSpent) * 100) / 100,
      transactionCount: personalTransactions.length,
      topCategories,
      averageDailySpending: Math.round((personalTotalSpent / 30) * 100) / 100,
    };
  }, [personalTransactions, allAnalytics]);
}

export function useBusinessBurnRate(businessAnalytics: AnalyticsData | null): number {
  return useMemo(() => {
    if (!businessAnalytics) return 0;
    return businessAnalytics.netCashFlow < 0 
      ? Math.abs(businessAnalytics.netCashFlow) 
      : 0;
  }, [businessAnalytics]);
}

export function useBusinessRunway(
  businessBurnRate: number,
  mockAccounts: any[] | undefined
): number | null {
  return useMemo(() => {
    if (!businessBurnRate || businessBurnRate === 0) return null;
    const businessAccounts = mockAccounts?.filter((a: any) => a.isBusiness === true) || [];
    const totalBalance = businessAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
    if (totalBalance <= 0) return null;
    const months = totalBalance / businessBurnRate;
    return Math.floor(months);
  }, [businessBurnRate, mockAccounts]);
}

