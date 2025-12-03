"use client";

/**
 * Connect Bank Page
 * Uses Plaid Link to connect user's bank accounts
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { usePlaidLink } from "react-plaid-link";
import { Header } from "../components/Header";
import { useUser } from "@clerk/nextjs";

export default function ConnectBankPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = useAction(api.plaid.createLinkToken);
  const exchangePublicToken = useAction(api.plaid.exchangePublicToken);
  const institutions = useQuery(api.plaid.getUserInstitutions);

  // Fetch link token on mount
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchLinkToken = async () => {
      try {
        setIsLoading(true);
        const response = await createLinkToken({});
        setLinkToken(response.linkToken);
      } catch (err: any) {
        console.error("Error creating link token:", err);
        setError(err.message || "Failed to initialize bank connection");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkToken();
  }, [isLoaded, user, createLinkToken]);

  // Handle Plaid Link success
  const onSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        setIsLoading(true);
        setError(null);

        await exchangePublicToken({
          publicToken,
          institutionId: metadata.institution.institution_id,
          institutionName: metadata.institution.name,
        });

        // Redirect to dashboard on success
        router.push("/dashboard?connected=true");
      } catch (err: any) {
        console.error("Error connecting bank:", err);
        setError(err.message || "Failed to connect bank account");
        setIsLoading(false);
      }
    },
    [exchangePublicToken, router]
  );

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        console.error("Plaid Link error:", err);
        setError(err.error_message || "Connection cancelled");
      }
      setIsLoading(false);
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Auto-open Plaid Link when ready
  useEffect(() => {
    if (ready && linkToken && !isLoading) {
      open();
    }
  }, [ready, linkToken, open, isLoading]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <h1 className="text-3xl font-bold mb-4 text-foreground">Connect Your Bank Account</h1>
          <p className="text-muted-foreground mb-8">
            Securely connect your bank account to automatically import transactions and track your finances.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="mt-2 text-destructive hover:underline text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {isLoading && !error && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                {linkToken ? "Opening secure connection..." : "Preparing connection..."}
              </p>
            </div>
          )}

          {!linkToken && !isLoading && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Initializing secure connection...</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Connected Banks Section */}
          {institutions && institutions.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Connected Banks</h2>
              <div className="space-y-3">
                {institutions.map((institution: any) => (
                  <div
                    key={institution._id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{institution.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status:{" "}
                        <span
                          className={
                            institution.syncStatus === "active"
                              ? "text-green-600 dark:text-green-400"
                              : institution.syncStatus === "error"
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }
                        >
                          {institution.syncStatus}
                        </span>
                      </p>
                    </div>
                    {institution.lastSyncAt && (
                      <p className="text-sm text-muted-foreground">
                        Last synced: {new Date(institution.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Your bank credentials are never stored. We use Plaid, a secure service trusted by thousands of financial apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

