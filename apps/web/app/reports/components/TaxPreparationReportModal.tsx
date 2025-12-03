"use client";

/**
 * Tax Preparation Packet Report Modal
 * Hero feature with PDF + CSV export
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportPDF } from "@/lib/pdfUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaxPreparationReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaxPreparationReportModal({
  open,
  onOpenChange,
}: TaxPreparationReportModalProps) {
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());

  const reportData = useQuery(api.reports.getTaxPreparationData, {
    taxYear,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = ["Category", "Amount"];
    const rows = reportData.deductibleCategories.map((cat: any) => [
      cat.category,
      formatCurrency(cat.amount),
    ]);

    // Add summary rows
    rows.push(["", ""]);
    rows.push(["Total Expenses", formatCurrency(reportData.totalExpenses)]);
    rows.push(["Home Office Expenses", formatCurrency(reportData.homeOfficeExpenses)]);
    rows.push(["Vehicle Expenses", formatCurrency(reportData.vehicleExpenses)]);
    rows.push(["Net Profit", formatCurrency(reportData.profit)]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tax-preparation-${taxYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("tax-preparation-report-content");
    if (!reportElement) {
      alert("Report content not found");
      return;
    }

    const filename = `tax-preparation-${taxYear}`;
    
    try {
      await generateReportPDF(
        reportElement,
        filename,
        "Tax Preparation Packet",
        `Tax Year: ${taxYear}`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!reportData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tax Preparation Packet</DialogTitle>
            <DialogDescription>Loading report data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tax Preparation Packet - {taxYear}</DialogTitle>
          <DialogDescription>
            Complete tax preparation data for {taxYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex justify-between items-end">
            <div className="w-48">
              <Label>Tax Year</Label>
              <Input
                type="number"
                min="2020"
                max={new Date().getFullYear()}
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  reportData.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(reportData.profit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Home Office</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.homeOfficeExpenses)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Vehicle Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.vehicleExpenses)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Deductible Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Deductible Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.deductibleCategories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.deductibleCategories.map((cat: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium capitalize">{cat.category}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(cat.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Deductible Expenses</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportData.deductibleCategories.reduce((sum: number, cat: any) => sum + cat.amount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No deductible expenses found for {taxYear}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          {reportData.note && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{reportData.note}</p>
              </CardContent>
            </Card>
          )}

          {/* Mileage Note */}
          {reportData.mileage === null && (
            <Card>
              <CardHeader>
                <CardTitle>Mileage Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mileage tracking requires separate entry. Vehicle expenses are shown as a proxy above.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

