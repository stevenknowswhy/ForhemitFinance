/**
 * Certification Tracking Section
 */

"use client";

import { Award } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface CertificationsSectionProps {
  cert8a: boolean;
  certWosb: boolean;
  certMbe: boolean;
  isoCertifications: string;
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  onCert8aChange: (value: boolean) => void;
  onCertWosbChange: (value: boolean) => void;
  onCertMbeChange: (value: boolean) => void;
  onIsoCertificationsChange: (value: string) => void;
  onGdprCompliantChange: (value: boolean) => void;
  onCcpaCompliantChange: (value: boolean) => void;
}

export function CertificationsSection({
  cert8a,
  certWosb,
  certMbe,
  isoCertifications,
  gdprCompliant,
  ccpaCompliant,
  onCert8aChange,
  onCertWosbChange,
  onCertMbeChange,
  onIsoCertificationsChange,
  onGdprCompliantChange,
  onCcpaCompliantChange,
}: CertificationsSectionProps) {
  return (
    <AccordionItem value="certifications" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          <span className="font-semibold">Certification Tracking</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="cert8a">8(a) Certification</Label>
            <Switch
              id="cert8a"
              checked={cert8a}
              onCheckedChange={onCert8aChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="certWosb">WOSB / EDWOSB</Label>
            <Switch
              id="certWosb"
              checked={certWosb}
              onCheckedChange={onCertWosbChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="certMbe">MBE / WBE / DBE</Label>
            <Switch
              id="certMbe"
              checked={certMbe}
              onCheckedChange={onCertMbeChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iso">ISO Certifications</Label>
            <Input
              id="iso"
              value={isoCertifications}
              onChange={(e) => onIsoCertificationsChange(e.target.value)}
              placeholder="e.g., ISO 9001, ISO 27001"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="gdpr">GDPR Compliant</Label>
            <Switch
              id="gdpr"
              checked={gdprCompliant}
              onCheckedChange={onGdprCompliantChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="ccpa">CCPA Compliant</Label>
            <Switch
              id="ccpa"
              checked={ccpaCompliant}
              onCheckedChange={onCcpaCompliantChange}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

