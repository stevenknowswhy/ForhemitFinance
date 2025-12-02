/**
 * Chart data generation utilities for analytics
 */

import {
  generateCashFlowData,
  generateCategoryData,
  generateMonthlyIncomeVsExpenses,
  generateMonthlyTrends,
} from "../../dashboard/utils/chartData";
import type { TabType } from "../types";

export function getChartData(
  activeTab: TabType,
  transactions: any[],
  accounts: any[],
  analytics: any,
  businessTransactions: any[],
  personalTransactions: any[],
  showBusinessInBlended: boolean,
  showPersonalInBlended: boolean
) {
  if (activeTab === "blended") {
    let combinedTx: any[] = [];
    
    if (showBusinessInBlended && showPersonalInBlended) {
      combinedTx = [...businessTransactions, ...personalTransactions];
    } else if (showBusinessInBlended) {
      combinedTx = businessTransactions;
    } else if (showPersonalInBlended) {
      combinedTx = personalTransactions;
    }

    return {
      cashFlow: generateCashFlowData(combinedTx, "all"),
      category: generateCategoryData(analytics),
      monthlyIncomeVsExpenses: generateMonthlyIncomeVsExpenses(combinedTx, "all"),
      monthlyTrends: generateMonthlyTrends(combinedTx, accounts, "all"),
    };
  } else {
    const filterType = activeTab;
    return {
      cashFlow: generateCashFlowData(transactions, filterType),
      category: generateCategoryData(analytics),
      monthlyIncomeVsExpenses: generateMonthlyIncomeVsExpenses(transactions, filterType),
      monthlyTrends: generateMonthlyTrends(transactions, accounts, filterType),
    };
  }
}

