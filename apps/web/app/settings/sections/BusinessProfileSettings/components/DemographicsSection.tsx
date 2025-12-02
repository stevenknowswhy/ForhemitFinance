/**
 * Business Demographics Section
 */

"use client";

import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface DemographicsSectionProps {
  womanOwned: boolean;
  minorityOwned: boolean;
  veteranOwned: boolean;
  lgbtqOwned: boolean;
  dbeStatus: boolean;
  hubzoneQualification: boolean;
  ruralUrban: string;
  onWomanOwnedChange: (value: boolean) => void;
  onMinorityOwnedChange: (value: boolean) => void;
  onVeteranOwnedChange: (value: boolean) => void;
  onLgbtqOwnedChange: (value: boolean) => void;
  onDbeStatusChange: (value: boolean) => void;
  onHubzoneQualificationChange: (value: boolean) => void;
  onRuralUrbanChange: (value: string) => void;
}

export function DemographicsSection({
  womanOwned,
  minorityOwned,
  veteranOwned,
  lgbtqOwned,
  dbeStatus,
  hubzoneQualification,
  ruralUrban,
  onWomanOwnedChange,
  onMinorityOwnedChange,
  onVeteranOwnedChange,
  onLgbtqOwnedChange,
  onDbeStatusChange,
  onHubzoneQualificationChange,
  onRuralUrbanChange,
}: DemographicsSectionProps) {
  return (
    <AccordionItem value="demographics" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span className="font-semibold">Business Demographics</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="womanOwned">Woman-Owned?</Label>
            <Switch
              id="womanOwned"
              checked={womanOwned}
              onCheckedChange={onWomanOwnedChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="minorityOwned">Minority-Owned?</Label>
            <Switch
              id="minorityOwned"
              checked={minorityOwned}
              onCheckedChange={onMinorityOwnedChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="veteranOwned">Veteran-Owned?</Label>
            <Switch
              id="veteranOwned"
              checked={veteranOwned}
              onCheckedChange={onVeteranOwnedChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="lgbtqOwned">LGBTQ-Owned?</Label>
            <Switch
              id="lgbtqOwned"
              checked={lgbtqOwned}
              onCheckedChange={onLgbtqOwnedChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="dbe">Disadvantaged Business Enterprise (DBE)</Label>
            <Switch
              id="dbe"
              checked={dbeStatus}
              onCheckedChange={onDbeStatusChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="hubzone">HUBZone Qualification</Label>
            <Switch
              id="hubzone"
              checked={hubzoneQualification}
              onCheckedChange={onHubzoneQualificationChange}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ruralUrban">Rural vs Urban Classification</Label>
            <Select value={ruralUrban} onValueChange={onRuralUrbanChange}>
              <SelectTrigger id="ruralUrban">
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rural">Rural</SelectItem>
                <SelectItem value="urban">Urban</SelectItem>
                <SelectItem value="suburban">Suburban</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

