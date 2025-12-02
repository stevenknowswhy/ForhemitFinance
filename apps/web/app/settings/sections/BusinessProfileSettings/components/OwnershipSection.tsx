/**
 * Ownership & Leadership Section
 */

"use client";

import { Users, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Owner } from "../types";

interface OwnershipSectionProps {
  owners: Owner[];
  usesRegisteredAgent: boolean;
  registeredAgentName: string;
  registeredAgentCompany: string;
  registeredAgentStreet: string;
  registeredAgentCity: string;
  registeredAgentState: string;
  registeredAgentZip: string;
  registeredAgentPhone: string;
  registeredAgentEmail: string;
  onAddOwner: () => void;
  onRemoveOwner: (id: string) => void;
  onOwnerChange: (id: string, field: keyof Owner, value: string) => void;
  onUsesRegisteredAgentChange: (value: boolean) => void;
  onRegisteredAgentNameChange: (value: string) => void;
  onRegisteredAgentCompanyChange: (value: string) => void;
  onRegisteredAgentStreetChange: (value: string) => void;
  onRegisteredAgentCityChange: (value: string) => void;
  onRegisteredAgentStateChange: (value: string) => void;
  onRegisteredAgentZipChange: (value: string) => void;
  onRegisteredAgentPhoneChange: (value: string) => void;
  onRegisteredAgentEmailChange: (value: string) => void;
  onClearRegisteredAgent: () => void;
}

export function OwnershipSection({
  owners,
  usesRegisteredAgent,
  registeredAgentName,
  registeredAgentCompany,
  registeredAgentStreet,
  registeredAgentCity,
  registeredAgentState,
  registeredAgentZip,
  registeredAgentPhone,
  registeredAgentEmail,
  onAddOwner,
  onRemoveOwner,
  onOwnerChange,
  onUsesRegisteredAgentChange,
  onRegisteredAgentNameChange,
  onRegisteredAgentCompanyChange,
  onRegisteredAgentStreetChange,
  onRegisteredAgentCityChange,
  onRegisteredAgentStateChange,
  onRegisteredAgentZipChange,
  onRegisteredAgentPhoneChange,
  onRegisteredAgentEmailChange,
  onClearRegisteredAgent,
}: OwnershipSectionProps) {
  return (
    <AccordionItem value="ownership" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span className="font-semibold">Ownership & Leadership Info</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {/* Owners List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Owners <span className="text-primary">⭐</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddOwner}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Owner
            </Button>
          </div>

          {owners.map((owner, index) => (
            <Card key={owner.id} className="p-4 border-2">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Owner {index + 1} {index === 0 && "(Primary)"}
                </h4>
                {owners.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOwner(owner.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`owner-name-${owner.id}`}>
                    Owner Name {index === 0 && <span className="text-primary">⭐</span>}
                  </Label>
                  <Input
                    id={`owner-name-${owner.id}`}
                    value={owner.name}
                    onChange={(e) => onOwnerChange(owner.id, "name", e.target.value)}
                    placeholder="Owner full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`owner-percent-${owner.id}`}>Ownership Percentage</Label>
                  <Input
                    id={`owner-percent-${owner.id}`}
                    type="number"
                    value={owner.ownershipPercentage}
                    onChange={(e) => onOwnerChange(owner.id, "ownershipPercentage", e.target.value)}
                    placeholder="%"
                    max={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`owner-linkedin-${owner.id}`}>LinkedIn Profile</Label>
                  <Input
                    id={`owner-linkedin-${owner.id}`}
                    type="url"
                    value={owner.linkedIn}
                    onChange={(e) => onOwnerChange(owner.id, "linkedIn", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`owner-role-${owner.id}`}>Role (Optional)</Label>
                  <Input
                    id={`owner-role-${owner.id}`}
                    value={owner.role || ""}
                    onChange={(e) => onOwnerChange(owner.id, "role", e.target.value)}
                    placeholder="e.g., CEO, CFO, COO"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Registered Agent - Conditional Reveal */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Registered Agent (Optional)
            </Label>
            {usesRegisteredAgent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearRegisteredAgent}
              >
                Clear
              </Button>
            )}
          </div>

          <Collapsible open={usesRegisteredAgent}>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registeredAgentName">Registered Agent Name</Label>
                  <Input
                    id="registeredAgentName"
                    value={registeredAgentName}
                    onChange={(e) => onRegisteredAgentNameChange(e.target.value)}
                    placeholder="Agent name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentCompany">Registered Agent Company (Optional)</Label>
                  <Input
                    id="registeredAgentCompany"
                    value={registeredAgentCompany}
                    onChange={(e) => onRegisteredAgentCompanyChange(e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="registeredAgentStreet">Street Address</Label>
                  <Input
                    id="registeredAgentStreet"
                    value={registeredAgentStreet}
                    onChange={(e) => onRegisteredAgentStreetChange(e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentCity">City</Label>
                  <Input
                    id="registeredAgentCity"
                    value={registeredAgentCity}
                    onChange={(e) => onRegisteredAgentCityChange(e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentState">State</Label>
                  <Input
                    id="registeredAgentState"
                    value={registeredAgentState}
                    onChange={(e) => onRegisteredAgentStateChange(e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentZip">ZIP Code</Label>
                  <Input
                    id="registeredAgentZip"
                    value={registeredAgentZip}
                    onChange={(e) => onRegisteredAgentZipChange(e.target.value)}
                    placeholder="ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentPhone">Phone</Label>
                  <Input
                    id="registeredAgentPhone"
                    type="tel"
                    value={registeredAgentPhone}
                    onChange={(e) => onRegisteredAgentPhoneChange(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registeredAgentEmail">Email</Label>
                  <Input
                    id="registeredAgentEmail"
                    type="email"
                    value={registeredAgentEmail}
                    onChange={(e) => onRegisteredAgentEmailChange(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

