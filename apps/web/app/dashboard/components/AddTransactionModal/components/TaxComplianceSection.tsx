/**
 * TaxComplianceSection Component
 * Handles tax rate, tax amount, tax-inclusive/exclusive, tax exemption, and 1099 tracking
 */

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TaxComplianceSectionProps {
  taxRate: string;
  taxAmount: string;
  isTaxInclusive: boolean;
  isTaxExempt: boolean;
  taxExemptReason: string;
  track1099: boolean;
  amount: string;
  onTaxRateChange: (rate: string) => void;
  onTaxAmountChange: (amount: string) => void;
  onTaxInclusiveChange: (inclusive: boolean) => void;
  onTaxExemptChange: (exempt: boolean) => void;
  onTaxExemptReasonChange: (reason: string) => void;
  onTrack1099Change: (track: boolean) => void;
}

export function TaxComplianceSection({
  taxRate,
  taxAmount,
  isTaxInclusive,
  isTaxExempt,
  taxExemptReason,
  track1099,
  amount,
  onTaxRateChange,
  onTaxAmountChange,
  onTaxInclusiveChange,
  onTaxExemptChange,
  onTaxExemptReasonChange,
  onTrack1099Change,
}: TaxComplianceSectionProps) {
  const handleTaxRateChange = (rate: string) => {
    onTaxRateChange(rate);
    if (rate && amount) {
      const rateNum = parseFloat(rate);
      const amt = parseFloat(amount);
      if (!isNaN(rateNum) && !isNaN(amt)) {
        onTaxAmountChange((amt * rateNum / 100).toFixed(2));
      }
    }
  };

  const handleCustomTaxRateChange = (value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate) && amount) {
      const amt = parseFloat(amount);
      if (!isNaN(amt)) {
        onTaxAmountChange((amt * rate / 100).toFixed(2));
      }
    }
    onTaxRateChange(value);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="tax-compliance">
        <AccordionTrigger className="text-sm font-medium text-foreground">
          Tax & Compliance
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Tax Rate */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tax Rate
            </label>
            <div className="flex gap-2">
              <select
                value={taxRate}
                onChange={(e) => handleTaxRateChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
              >
                <option value="">Select rate...</option>
                <option value="0">0% (No tax)</option>
                <option value="5">5%</option>
                <option value="6">6%</option>
                <option value="7">7%</option>
                <option value="8">8%</option>
                <option value="8.25">8.25%</option>
                <option value="8.5">8.5%</option>
                <option value="9">9%</option>
                <option value="10">10%</option>
                <option value="custom">Custom...</option>
              </select>
              {taxRate === "custom" && (
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={taxRate === "custom" ? "" : taxRate}
                    onChange={(e) => handleCustomTaxRateChange(e.target.value)}
                    placeholder="Enter %"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Tax Amount */}
          {taxRate && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tax Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => onTaxAmountChange(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Tax Inclusive/Exclusive Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
            <div>
              <label className="text-sm font-medium text-foreground">
                Tax-Inclusive
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Tax is included in the total amount
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTaxInclusiveChange(!isTaxInclusive)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                isTaxInclusive ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                  isTaxInclusive && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Tax Exemption */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
            <div>
              <label className="text-sm font-medium text-foreground">
                Tax Exempt
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                This transaction is tax-exempt
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTaxExemptChange(!isTaxExempt)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                isTaxExempt ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                  isTaxExempt && "translate-x-5"
                )}
              />
            </button>
          </div>

          {isTaxExempt && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Exemption Reason
              </label>
              <input
                type="text"
                value={taxExemptReason}
                onChange={(e) => onTaxExemptReasonChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                placeholder="e.g., Resale certificate, Non-profit"
              />
            </div>
          )}

          {/* 1099 Tracking */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
            <div>
              <label className="text-sm font-medium text-foreground">
                1099 Tracking
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Flag for 1099 reporting (contractors)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTrack1099Change(!track1099)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center",
                track1099 ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform",
                  track1099 && "translate-x-5"
                )}
              />
            </button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

