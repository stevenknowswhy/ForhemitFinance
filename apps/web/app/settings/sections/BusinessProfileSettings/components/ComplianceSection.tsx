/**
 * Compliance & Verification IDs Section
 */

"use client";

import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface ComplianceSectionProps {
  dunsNumber: string;
  samUei: string;
  cageCode: string;
  stateBusinessLicense: string;
  localBusinessLicense: string;
  resellersPermit: string;
  stateTaxRegistrationId: string;
  onDunsNumberChange: (value: string) => void;
  onSamUeiChange: (value: string) => void;
  onCageCodeChange: (value: string) => void;
  onStateBusinessLicenseChange: (value: string) => void;
  onLocalBusinessLicenseChange: (value: string) => void;
  onResellersPermitChange: (value: string) => void;
  onStateTaxRegistrationIdChange: (value: string) => void;
}

export function ComplianceSection({
  dunsNumber,
  samUei,
  cageCode,
  stateBusinessLicense,
  localBusinessLicense,
  resellersPermit,
  stateTaxRegistrationId,
  onDunsNumberChange,
  onSamUeiChange,
  onCageCodeChange,
  onStateBusinessLicenseChange,
  onLocalBusinessLicenseChange,
  onResellersPermitChange,
  onStateTaxRegistrationIdChange,
}: ComplianceSectionProps) {
  return (
    <AccordionItem value="compliance" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="font-semibold">Compliance & Verification IDs</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duns">
              DUNS Number <span className="text-primary">⭐</span>
            </Label>
            <Input
              id="duns"
              value={dunsNumber}
              onChange={(e) => onDunsNumberChange(e.target.value)}
              placeholder="9-digit DUNS number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sam">
              SAM.gov UEI <span className="text-primary">⭐</span>
            </Label>
            <Input
              id="sam"
              value={samUei}
              onChange={(e) => onSamUeiChange(e.target.value)}
              placeholder="Unique Entity Identifier"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cage">CAGE Code</Label>
            <Input
              id="cage"
              value={cageCode}
              onChange={(e) => onCageCodeChange(e.target.value)}
              placeholder="5-character CAGE code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateLicense">State Business License Number</Label>
            <Input
              id="stateLicense"
              value={stateBusinessLicense}
              onChange={(e) => onStateBusinessLicenseChange(e.target.value)}
              placeholder="State license number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localLicense">Local Business License / Permit Numbers</Label>
            <Input
              id="localLicense"
              value={localBusinessLicense}
              onChange={(e) => onLocalBusinessLicenseChange(e.target.value)}
              placeholder="Local license numbers"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resellersPermit">Reseller's Permit / Seller's Permit</Label>
            <Input
              id="resellersPermit"
              value={resellersPermit}
              onChange={(e) => onResellersPermitChange(e.target.value)}
              placeholder="Reseller permit number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateTaxId">State Tax Registration ID</Label>
            <Input
              id="stateTaxId"
              value={stateTaxRegistrationId}
              onChange={(e) => onStateTaxRegistrationIdChange(e.target.value)}
              placeholder="State tax registration ID"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

