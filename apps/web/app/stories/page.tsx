"use client";

/**
 * Stories Page - Redirects to Insights tab
 * Stories is now integrated into the Insights area at /reports?tab=stories
 */

import { useEffect } from "react";
import { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function StoriesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Insights tab with stories selected
    router.replace("/reports?tab=stories");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting to Insights...</div>
    </div>
  );
}

