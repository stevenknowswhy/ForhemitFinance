"use client";

/**
 * Transaction Export to Excel Modal
 * Allows users to download transactions with comprehensive filters
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface TransactionExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionExportModal({
  open,
  onOpenChange,
}: TransactionExportModalProps) {
  const [dateRangePreset, setDateRangePreset] = useState<"3months" | "6months" | "12months" | "custom" | "all">("12months");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [filterType, setFilterType] = useState<"business" | "personal" | "blended">("blended");
  const [transactionType, setTransactionType] = useState<"all" | "income" | "expense">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (dateRangePreset === "all") {
      return { start: undefined, end: undefined };
    }

    const end = new Date();
    let start: Date;
    
    if (dateRangePreset === "3months") {
      start = new Date();
      start.setMonth(start.getMonth() - 3);
    } else if (dateRangePreset === "6months") {
      start = new Date();
      start.setMonth(start.getMonth() - 6);
    } else if (dateRangePreset === "12months") {
      start = new Date();
      start.setMonth(start.getMonth() - 12);
    } else {
      start = customStartDate ? new Date(customStartDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      end.setTime(customEndDate ? new Date(customEndDate).getTime() : Date.now());
    }
    
    return {
      start: start.getTime(),
      end: end.getTime(),
    };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Fetch transactions with filters
  const transactions = useQuery(api.plaid.getMockTransactions, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
  });

  // Fetch all accounts for account name lookup
  const accounts = useQuery(api.accounts.getAll, {});

  // Create account lookup map
  const accountMap = useMemo(() => {
    if (!accounts) return new Map();
    const map = new Map();
    accounts.forEach((account: any) => {
      map.set(account._id, account.name);
    });
    return map;
  }, [accounts]);

  // Get all categories for filter dropdown
  const allCategories = useMemo(() => {
    if (!transactions) return [];
    const categories = new Set<string>();
    transactions.forEach((t: any) => {
      const cat = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
      categories.add(cat);
    });
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Filter by business/personal/blended
    if (filterType === "business") {
      filtered = filtered.filter((t: any) => t.isBusiness === true);
    } else if (filterType === "personal") {
      filtered = filtered.filter((t: any) => t.isBusiness === false);
    }
    // "blended" includes everything

    // Filter by transaction type (income/expense)
    if (transactionType === "income") {
      filtered = filtered.filter((t: any) => t.amount > 0);
    } else if (transactionType === "expense") {
      filtered = filtered.filter((t: any) => t.amount < 0);
    }
    // "all" includes everything

    // Filter by category (if not "all")
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t: any) => {
        const cat = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        return cat === selectedCategory;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.dateTimestamp || new Date(a.date).getTime();
      const dateB = b.dateTimestamp || new Date(b.date).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [transactions, filterType, transactionType, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExport = async () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("No transactions to export with the selected filters.");
      return;
    }

    if (!accounts) {
      alert("Loading accounts... Please try again in a moment.");
      return;
    }

    setIsExporting(true);

    try {
      // Prepare data for Excel with double-entry bookkeeping
      const excelData: any[] = [];

      filteredTransactions.forEach((t: any) => {
        const date = t.dateTimestamp 
          ? new Date(t.dateTimestamp).toLocaleDateString()
          : new Date(t.date).toLocaleDateString();
        
        const amount = t.amount;
        const isIncome = amount > 0;
        const category = t.categoryName || (t.category && t.category[0]) || "Uncategorized";
        const merchant = t.merchantName || t.merchant || t.description || "Unknown";
        const description = t.description || "";
        const bankAccount = accountMap.get(t.accountId) || "Unknown";
        const isBusiness = t.isBusiness ? "Business" : "Personal";
        const type = isIncome ? "Income" : "Expense";

        // Check if transaction has line items (advanced mode)
        const lineItems = t.lineItems;
        if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
          // Advanced mode: Create a row for each line item
          lineItems.forEach((lineItem, index) => {
            const debitAccount = lineItem.debitAccountId 
              ? accountMap.get(lineItem.debitAccountId) || "Unknown"
              : "Not Set";
            const creditAccount = lineItem.creditAccountId 
              ? accountMap.get(lineItem.creditAccountId) || "Unknown"
              : "Not Set";

            excelData.push({
              Date: index === 0 ? date : "", // Only show date on first line item
              Type: index === 0 ? type : "",
              Amount: lineItem.amount,
              "Amount (Formatted)": formatCurrency(lineItem.amount),
              Merchant: index === 0 ? merchant : "",
              Description: lineItem.description || (index === 0 ? description : ""),
              Category: lineItem.category || category,
              "Business/Personal": index === 0 ? isBusiness : "",
              "Bank Account": index === 0 ? bankAccount : "",
              "Debit Account": debitAccount,
              "Credit Account": creditAccount,
              "Debit Amount": lineItem.debitAccountId ? formatCurrency(Math.abs(lineItem.amount)) : "",
              "Credit Amount": lineItem.creditAccountId ? formatCurrency(Math.abs(lineItem.amount)) : "",
              "Transaction ID": index === 0 ? (t.transactionId || "") : "",
              Currency: index === 0 ? (t.currency || "USD") : "",
              Pending: index === 0 ? (t.status === "pending" ? "Yes" : "No") : "",
              "Entry Mode": "Advanced",
              "Line Item": `${index + 1} of ${lineItems.length}`,
            });
          });
        } else {
          // Simple mode: Single row with debit/credit accounts
          const debitAccount = t.debitAccountId 
            ? accountMap.get(t.debitAccountId) || "Unknown"
            : "Not Set";
          const creditAccount = t.creditAccountId 
            ? accountMap.get(t.creditAccountId) || "Unknown"
            : "Not Set";

          excelData.push({
            Date: date,
            Type: type,
            Amount: amount,
            "Amount (Formatted)": formatCurrency(amount),
            Merchant: merchant,
            Description: description,
            Category: category,
            "Business/Personal": isBusiness,
            "Bank Account": bankAccount,
            "Debit Account": debitAccount,
            "Credit Account": creditAccount,
            "Debit Amount": t.debitAccountId ? formatCurrency(Math.abs(amount)) : "",
            "Credit Amount": t.creditAccountId ? formatCurrency(Math.abs(amount)) : "",
            "Transaction ID": t.transactionId || "",
            Currency: t.currency || "USD",
            Pending: t.status === "pending" ? "Yes" : "No",
            "Entry Mode": t.entryMode || "Simple",
            "Line Item": "",
          });
        }
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 12 }, // Amount
        { wch: 15 }, // Amount (Formatted)
        { wch: 25 }, // Merchant
        { wch: 30 }, // Description
        { wch: 20 }, // Category
        { wch: 15 }, // Business/Personal
        { wch: 20 }, // Bank Account
        { wch: 25 }, // Debit Account
        { wch: 25 }, // Credit Account
        { wch: 15 }, // Debit Amount
        { wch: 15 }, // Credit Amount
        { wch: 20 }, // Transaction ID
        { wch: 8 },  // Currency
        { wch: 8 },  // Pending
        { wch: 12 }, // Entry Mode
        { wch: 12 }, // Line Item
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      // Generate filename with filters
      const dateStr = dateRangePreset === "all" 
        ? "all-time"
        : dateRange.start && dateRange.end
        ? `${formatDate(new Date(dateRange.start))}-to-${formatDate(new Date(dateRange.end))}`
        : "custom-range";
      
      const filterStr = filterType !== "blended" ? `-${filterType}` : "";
      const typeStr = transactionType !== "all" ? `-${transactionType}` : "";
      const categoryStr = selectedCategory !== "all" ? `-${selectedCategory.replace(/[^a-zA-Z0-9]/g, "-")}` : "";
      
      const filename = `transactions-${dateStr}${filterStr}${typeStr}${categoryStr}`;

      // Write file
      XLSX.writeFile(wb, `${filename}.xlsx`);

      setIsExporting(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export transactions. Please try again.");
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export Transactions to Excel
          </DialogTitle>
          <DialogDescription>
            Download your transactions with comprehensive filtering options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date Range</Label>
                  <Select
                    value={dateRangePreset}
                    onValueChange={(value: any) => setDateRangePreset(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="12months">Last 12 Months</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateRangePreset === "custom" && (
                  <>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Business/Personal/Blended */}
              <div>
                <Label>Business/Personal</Label>
                <Select
                  value={filterType}
                  onValueChange={(value: any) => setFilterType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blended">Blended (All)</SelectItem>
                    <SelectItem value="business">Business Only</SelectItem>
                    <SelectItem value="personal">Personal Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Income/Expense */}
              <div>
                <Label>Transaction Type</Label>
                <Select
                  value={transactionType}
                  onValueChange={(value: any) => setTransactionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="expense">Expenses Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value: any) => setSelectedCategory(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((cat: any) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions to Export:</span>
                <span className="font-semibold">{filteredTransactions.length}</span>
              </div>
              {filteredTransactions.some((t) => t.lineItems && Array.isArray(t.lineItems) && t.lineItems.length > 0) && (
                <div className="text-xs text-muted-foreground mt-1">
                  Note: Advanced entries with line items will create multiple rows in the export
                </div>
              )}
              {filteredTransactions.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Income:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(
                          filteredTransactions
                            .filter((t: any) => t.amount > 0)
                            .reduce((sum: number, t: any) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(
                          Math.abs(
                            filteredTransactions
                              .filter((t: any) => t.amount < 0)
                              .reduce((sum: number, t: any) => sum + t.amount, 0)
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Net:</span>
                      <span className="font-bold">
                        {formatCurrency(
                          filteredTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !filteredTransactions || filteredTransactions.length === 0 || !accounts}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting 
                ? "Exporting..." 
                : accounts 
                  ? `Export ${filteredTransactions.length} Transactions`
                  : "Loading accounts..."
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

