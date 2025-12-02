"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useOrg } from "../../contexts/OrgContext";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2 } from "lucide-react";

export function AccountingPreferencesSettings() {
  const { toast } = useToast();
  const { currentOrgId, currentOrg } = useOrg();

  const businessProfile = useQuery(api.businessProfiles.getBusinessProfile,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const updateBusinessProfile = useMutation(api.businessProfiles.updateBusinessProfile);

  const [fiscalYearStart, setFiscalYearStart] = useState("01-01");
  const [accountingMethod, setAccountingMethod] = useState("cash");
  const [businessEntityType, setBusinessEntityType] = useState("sole_proprietorship");
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from backend
  useEffect(() => {
    if (currentOrg) {
      setFiscalYearStart(currentOrg.fiscalYearStart || "01-01");
      setAccountingMethod(currentOrg.accountingMethod || "cash");
    }
    if (businessProfile) {
      setBusinessEntityType(businessProfile.entityType || "sole_proprietorship");
    }
  }, [currentOrg, businessProfile]);

  const handleSave = async () => {
    if (!currentOrgId) return;

    setIsSaving(true);
    try {
      // Update Organization Settings
      await updateOrganization({
        orgId: currentOrgId,
        fiscalYearStart,
        accountingMethod: accountingMethod as "cash" | "accrual",
      });

      // Update Business Profile (Entity Type)
      await updateBusinessProfile({
        entityType: businessEntityType,
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
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentOrgId) return null;

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
                <SelectItem value="nonprofit">Nonprofit</SelectItem>
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

      <Button onClick={handleSave} className="w-full" disabled={isSaving}>
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Preferences
      </Button>
    </div>
  );
}

