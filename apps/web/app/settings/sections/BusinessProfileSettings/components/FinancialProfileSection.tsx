/**
 * Financial Profile Section
 */

"use client";

import { TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface FinancialProfileSectionProps {
  primaryBankName: string;
  merchantProvider: string;
  averageMonthlyRevenue: string;
  fundingStatus: string;
  stageOfBusiness: string;
  onPrimaryBankNameChange: (value: string) => void;
  onMerchantProviderChange: (value: string) => void;
  onAverageMonthlyRevenueChange: (value: string) => void;
  onFundingStatusChange: (value: string) => void;
  onStageOfBusinessChange: (value: string) => void;
}

export function FinancialProfileSection({
  primaryBankName,
  merchantProvider,
  averageMonthlyRevenue,
  fundingStatus,
  stageOfBusiness,
  onPrimaryBankNameChange,
  onMerchantProviderChange,
  onAverageMonthlyRevenueChange,
  onFundingStatusChange,
  onStageOfBusinessChange,
}: FinancialProfileSectionProps) {
  return (
    <AccordionItem value="financial" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">Financial Profile</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryBank">Primary Bank Name</Label>
            <Input
              id="primaryBank"
              value={primaryBankName}
              onChange={(e) => onPrimaryBankNameChange(e.target.value)}
              placeholder="Bank name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchantProvider">Merchant Processing Provider</Label>
            <Select value={merchantProvider} onValueChange={onMerchantProviderChange}>
              <SelectTrigger id="merchantProvider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyRevenue">Average Monthly Revenue (optional)</Label>
            <Input
              id="monthlyRevenue"
              type="number"
              value={averageMonthlyRevenue}
              onChange={(e) => onAverageMonthlyRevenueChange(e.target.value)}
              placeholder="$0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundingStatus">Funding Status</Label>
            <Select value={fundingStatus} onValueChange={onFundingStatusChange}>
              <SelectTrigger id="fundingStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                <SelectItem value="angel">Angel</SelectItem>
                <SelectItem value="vc_backed">VC-Backed</SelectItem>
                <SelectItem value="friends_family">Friends & Family</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="stage">Stage of Business</Label>
            <Select value={stageOfBusiness} onValueChange={onStageOfBusinessChange}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_revenue">Pre-Revenue</SelectItem>
                <SelectItem value="early_revenue">Early Revenue</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

