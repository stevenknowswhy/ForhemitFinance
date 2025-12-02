/**
 * Core Business Identity Section
 */

"use client";

import { Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface CoreBusinessIdentitySectionProps {
  legalBusinessName: string;
  dbaTradeName: string;
  einTaxId: string;
  entityType: string;
  filingState: string;
  dateOfIncorporation: string;
  naicsCode: string;
  businessCategory: string;
  businessStructure: string;
  onLegalBusinessNameChange: (value: string) => void;
  onDbaTradeNameChange: (value: string) => void;
  onEinTaxIdChange: (value: string) => void;
  onEntityTypeChange: (value: string) => void;
  onFilingStateChange: (value: string) => void;
  onDateOfIncorporationChange: (value: string) => void;
  onNaicsCodeChange: (value: string) => void;
  onBusinessCategoryChange: (value: string) => void;
  onBusinessStructureChange: (value: string) => void;
}

export function CoreBusinessIdentitySection({
  legalBusinessName,
  dbaTradeName,
  einTaxId,
  entityType,
  filingState,
  dateOfIncorporation,
  naicsCode,
  businessCategory,
  businessStructure,
  onLegalBusinessNameChange,
  onDbaTradeNameChange,
  onEinTaxIdChange,
  onEntityTypeChange,
  onFilingStateChange,
  onDateOfIncorporationChange,
  onNaicsCodeChange,
  onBusinessCategoryChange,
  onBusinessStructureChange,
}: CoreBusinessIdentitySectionProps) {
  return (
    <AccordionItem value="core-identity" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <span className="font-semibold">Core Business Identity</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="legalName">
              Legal Business Name <span className="text-primary">⭐</span>
            </Label>
            <Input
              id="legalName"
              value={legalBusinessName}
              onChange={(e) => onLegalBusinessNameChange(e.target.value)}
              placeholder="Enter legal business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dba">
              DBA / Trade Name <span className="text-primary">⭐</span>
            </Label>
            <Input
              id="dba"
              value={dbaTradeName}
              onChange={(e) => onDbaTradeNameChange(e.target.value)}
              placeholder="Doing business as"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ein">
              EIN / Tax ID Number <span className="text-primary">⭐</span>
            </Label>
            <Input
              id="ein"
              value={einTaxId}
              onChange={(e) => onEinTaxIdChange(e.target.value)}
              placeholder="XX-XXXXXXX"
              maxLength={11}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityType">Business Entity Type</Label>
            <Select value={entityType} onValueChange={onEntityTypeChange}>
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select entity type" />
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

          <div className="space-y-2">
            <Label htmlFor="filingState">Corporation Filing State / Jurisdiction</Label>
            <Input
              id="filingState"
              value={filingState}
              onChange={(e) => onFilingStateChange(e.target.value)}
              placeholder="e.g., Delaware"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incorporationDate">Date of Incorporation</Label>
            <Input
              id="incorporationDate"
              type="date"
              value={dateOfIncorporation}
              onChange={(e) => onDateOfIncorporationChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="naics">NAICS Code</Label>
            <Input
              id="naics"
              value={naicsCode}
              onChange={(e) => onNaicsCodeChange(e.target.value)}
              placeholder="Enter NAICS code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Business Category</Label>
            <Input
              id="category"
              value={businessCategory}
              onChange={(e) => onBusinessCategoryChange(e.target.value)}
              placeholder="e.g., Technology, Retail, Services"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="structure">
              Business Structure Details <span className="text-primary">⭐</span>
            </Label>
            <Select value={businessStructure} onValueChange={onBusinessStructureChange}>
              <SelectTrigger id="structure">
                <SelectValue placeholder="Select structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_member_llc">Single-Member LLC</SelectItem>
                <SelectItem value="multi_member_llc">Multi-Member LLC</SelectItem>
                <SelectItem value="c_corp_class_a">C-Corp Class A</SelectItem>
                <SelectItem value="c_corp_class_b">C-Corp Class B</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

