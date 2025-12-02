"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImpersonationBanner() {
    const router = useRouter();
    const activeImpersonation = useQuery(api.super_admin.getActiveImpersonation);
    const stopImpersonation = useMutation(api.super_admin.stopImpersonation);

    if (!activeImpersonation) return null;

    const handleStop = async () => {
        await stopImpersonation();
        // Refresh to clear context
        window.location.reload();
    };

    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-50">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                    Impersonating: <strong>{activeImpersonation.orgName}</strong> as {activeImpersonation.role}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStop}
                    className="bg-white text-amber-600 hover:bg-amber-50 border-none"
                >
                    Stop Impersonation
                </Button>
            </div>
        </div>
    );
}
