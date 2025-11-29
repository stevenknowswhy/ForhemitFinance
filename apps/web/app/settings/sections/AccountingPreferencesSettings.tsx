"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export function AccountingPreferencesSettings() {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [fiscalYearStart, setFiscalYearStart] = useState("01-01");
  const [accountingMethod, setAccountingMethod] = useState("cash");
  const [businessEntityType, setBusinessEntityType] = useState("sole_proprietorship");

  // Load preferences from backend
  useEffect(() => {
    if (currentUser?.preferences) {
      setFiscalYearStart(currentUser.preferences.fiscalYearStart || "01-01");
      setAccountingMethod(currentUser.preferences.accountingMethod || "cash");
      setBusinessEntityType(currentUser.preferences.businessEntityType || "sole_proprietorship");
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        fiscalYearStart: fiscalYearStart,
        accountingMethod: accountingMethod as "cash" | "accrual",
        businessEntityType: businessEntityType as "sole_proprietorship" | "llc" | "s_corp" | "c_corp" | "partnership" | "nonprofit",
      });

      toast({
        title: "Preferences saved",
        description: "Your accounting preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Fiscal Year
          </CardTitle>
          <CardDescription>Set your fiscal year start date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fiscalYearStart">Fiscal Year Start Date</Label>
            <Input
              id="fiscalYearStart"
              type="text"
              value={fiscalYearStart}
              onChange={(e) => setFiscalYearStart(e.target.value)}
              placeholder="MM-DD (e.g., 01-01)"
              pattern="\d{2}-\d{2}"
            />
            <p className="text-xs text-muted-foreground">
              Format: MM-DD (e.g., 01-01 for January 1st)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounting Method</CardTitle>
          <CardDescription>
            Choose between cash or accrual accounting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="accountingMethod">Method</Label>
            <Select value={accountingMethod} onValueChange={setAccountingMethod}>
              <SelectTrigger id="accountingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash Basis</SelectItem>
                <SelectItem value="accrual">Accrual Basis</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cash basis: Record transactions when money changes hands. Accrual basis: Record transactions when they occur.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Entity Type</CardTitle>
          <CardDescription>
            Select your business entity type for tax purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type</Label>
            <Select value={businessEntityType} onValueChange={setBusinessEntityType}>
              <SelectTrigger id="entityType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="llc">LLC</SelectItem>
                <SelectItem value="s_corp">S-Corporation</SelectItem>
                <SelectItem value="c_corp">C-Corporation</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Tax Categories</CardTitle>
          <CardDescription>
            Configure default tax categories for transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tax category configuration coming soon. This will allow you to set default tax categories for different transaction types.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Preferences
      </Button>
    </div>
  );
}

