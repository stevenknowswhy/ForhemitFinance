/**
 * Business Address & Contact Info Section
 */

"use client";

import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface AddressContactSectionProps {
  registeredAddress: string;
  headquartersAddress: string;
  mailingAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  onRegisteredAddressChange: (value: string) => void;
  onHeadquartersAddressChange: (value: string) => void;
  onMailingAddressChange: (value: string) => void;
  onBusinessPhoneChange: (value: string) => void;
  onBusinessEmailChange: (value: string) => void;
  onBusinessWebsiteChange: (value: string) => void;
}

export function AddressContactSection({
  registeredAddress,
  headquartersAddress,
  mailingAddress,
  businessPhone,
  businessEmail,
  businessWebsite,
  onRegisteredAddressChange,
  onHeadquartersAddressChange,
  onMailingAddressChange,
  onBusinessPhoneChange,
  onBusinessEmailChange,
  onBusinessWebsiteChange,
}: AddressContactSectionProps) {
  return (
    <AccordionItem value="address-contact" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <span className="font-semibold">Business Address & Contact Info</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="registeredAddress">Registered Business Address</Label>
            <Textarea
              id="registeredAddress"
              value={registeredAddress}
              onChange={(e) => onRegisteredAddressChange(e.target.value)}
              placeholder="Street address, City, State, ZIP"
              rows={2}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="headquartersAddress">Headquarters Address (if different)</Label>
            <Textarea
              id="headquartersAddress"
              value={headquartersAddress}
              onChange={(e) => onHeadquartersAddressChange(e.target.value)}
              placeholder="Street address, City, State, ZIP"
              rows={2}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mailingAddress">Mailing Address (if different)</Label>
            <Textarea
              id="mailingAddress"
              value={mailingAddress}
              onChange={(e) => onMailingAddressChange(e.target.value)}
              placeholder="Street address, City, State, ZIP"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              type="tel"
              value={businessPhone}
              onChange={(e) => onBusinessPhoneChange(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email</Label>
            <Input
              id="businessEmail"
              type="email"
              value={businessEmail}
              onChange={(e) => onBusinessEmailChange(e.target.value)}
              placeholder="contact@business.com"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="businessWebsite">Business Website</Label>
            <Input
              id="businessWebsite"
              type="url"
              value={businessWebsite}
              onChange={(e) => onBusinessWebsiteChange(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

