"use client";

import { useState } from "react";
import { useOrgContext } from "../contexts/OrgContext";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function OrgSwitcher() {
  const { currentOrgId, userOrganizations, setCurrentOrg, isLoading } = useOrgContext();
  const [isChanging, setIsChanging] = useState(false);

  if (isLoading) {
    return (
      <div className="w-[200px] h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  if (userOrganizations.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        No organizations
      </Button>
    );
  }

  const handleOrgChange = async (newOrgId: string) => {
    setIsChanging(true);
    try {
      await setCurrentOrg(newOrgId as Id<"organizations">);
    } catch (error) {
      console.error("Failed to switch org:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentOrg = userOrganizations.find(
    (org: any) => org._id === currentOrgId
  );

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentOrgId || undefined}
        onValueChange={handleOrgChange}
        disabled={isChanging}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select organization">
            {currentOrg ? (
              <span className="truncate">{currentOrg.name}</span>
            ) : (
              "Select organization"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userOrganizations.map((org: any) => (
            <SelectItem key={org._id} value={org._id}>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {org.role?.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* TODO: Add "Create new org" button in Phase 3 */}
    </div>
  );
}
