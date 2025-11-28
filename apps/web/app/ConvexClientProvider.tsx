"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode, useEffect, useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Get Clerk auth token and pass it to Convex
  // Note: This hook must be used inside ClerkProvider (which is in layout.tsx)
  const { getToken, isLoaded } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // Set up Convex auth token fetcher
    convex.setAuth(async () => {
      try {
        // Try to get token with "convex" template first
        let clerkToken = null;
        try {
          clerkToken = await getToken({ template: "convex" });
        } catch (templateError: any) {
          // If template doesn't exist, try without template
          if (templateError?.message?.includes("No JWT template")) {
            console.warn("Clerk JWT template 'convex' not found. Using default token. Please set up the template in Clerk Dashboard.");
            setAuthError("JWT template 'convex' not configured in Clerk. See console for setup instructions.");
            // Try to get default token as fallback
            try {
              clerkToken = await getToken();
            } catch (defaultError) {
              console.error("Failed to get default Clerk token:", defaultError);
              return null;
            }
          } else {
            throw templateError;
          }
        }
        
        setToken(clerkToken);
        setAuthError(null);
        return clerkToken || null;
      } catch (error: any) {
        console.error("Failed to get Clerk token:", error);
        setAuthError(error.message || "Authentication failed");
        return null;
      }
    });
  }, [getToken, isLoaded]);
  
  return (
    <ConvexProvider client={convex}>
      {authError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Setup Required:</strong> {authError}
                <br />
                <a 
                  href="https://dashboard.clerk.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Configure JWT template in Clerk Dashboard
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </ConvexProvider>
  );
}

