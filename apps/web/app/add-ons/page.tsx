"use client";

/**
 * Add-ons Marketplace Page
 * Browse and manage available add-ons with pricing, trials, and purchases
 */

import { useOrg } from "@/app/contexts/OrgContext";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookOpen, FileText, Loader2, CheckCircle2, Lock, Sparkles, Clock, AlertCircle, Search, Filter, ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id, Doc } from "@convex/_generated/dataModel";
import { useDebounce } from "use-debounce";

type EnrichedAddon = Doc<"addons"> & {
  entitlement: {
    status: string;
    source: string;
    trialEnd?: number;
    purchasedAt?: number;
    lastPaymentStatus?: string;
  } | null;
  campaigns: Doc<"pricing_campaigns">[];
  isEnabled: boolean;
};

// Map icon names to components
const iconMap: { [key: string]: React.ElementType } = {
  BookOpen,
  FileText,
  Sparkles,
};

function formatPrice(amount: number, currency: string = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function AddOnsPage() {
  const { currentOrgId, userRole } = useOrg();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const canManageModules = userRole === "ORG_OWNER" || userRole === "ORG_ADMIN";

  // Get available add-ons
  const addons = useQuery(
    // @ts-ignore
    api.addons.getAvailableAddons,
    currentOrgId ? {
      orgId: currentOrgId,
      search: debouncedSearch || undefined,
      category: category === "all" ? undefined : category,
      sortBy: sortBy,
    } : "skip"
  );

  // Mutations
  const enableFreeAddon = useMutation(api.addons.enableFreeAddon);
  const startTrial = useMutation(api.addons.startAddonTrial);
  const declineOnboarding = useMutation(api.addons.declineOnboardingOffer);
  const declinePreTrial = useMutation(api.addons.declinePreTrialOffer);
  const toggleAddon = useMutation(api.addons.toggleAddon);

  // Handle toggle
  const handleToggle = async (addonId: Id<"addons">) => {
    if (!currentOrgId) return;
    setLoadingAction(addonId);
    try {
      await toggleAddon({ orgId: currentOrgId, addonId });
    } catch (error) {
      console.error("Failed to toggle add-on:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle enabling free add-on
  const handleEnableFree = async (addonId: Id<"addons">) => {
    if (!currentOrgId) return;
    setLoadingAction(addonId);
    try {
      await enableFreeAddon({ orgId: currentOrgId, addonId });
    } catch (error) {
      console.error("Failed to enable add-on:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle starting trial
  const handleStartTrial = async (addonId: Id<"addons">) => {
    if (!currentOrgId) return;
    setLoadingAction(addonId);
    try {
      await startTrial({ orgId: currentOrgId, addonId });
    } catch (error) {
      console.error("Failed to start trial:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle purchase
  const handlePurchase = async (addonId: Id<"addons">, context: "onboarding" | "trial" | "marketplace" = "marketplace") => {
    if (!currentOrgId) return;
    setLoadingAction(addonId);
    try {
      const response = await fetch("/api/checkout/addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: currentOrgId, addonId, context }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Failed to start purchase:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Get pricing for each add-on
  const getPricing = async (addonId: Id<"addons">) => {
    if (!currentOrgId) return null;
    // This would use a query hook, but for now we'll calculate in component
    return null;
  };

  const getAddonIcon = (iconName?: string) => {
    return iconMap[iconName || ""] || Sparkles;
  };

  const getAddonStatus = (addon: any) => {
    if (!addon.entitlement) {
      return "not_enabled";
    }
    if (addon.entitlement.status === "active") {
      return "active";
    }
    if (addon.entitlement.status === "trialing") {
      if (addon.entitlement.trialEnd && Date.now() > addon.entitlement.trialEnd) {
        return "trial_expired";
      }
      return "trialing";
    }
    if (addon.entitlement.status === "expired") {
      return "expired";
    }
    return "not_enabled";
  };

  const getDaysUntilTrialEnd = (trialEnd?: number) => {
    if (!trialEnd) return null;
    const days = Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DesktopNavigation />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add-ons & Modules</h1>
          <p className="text-muted-foreground mb-6">
            Enhance your financial app with optional add-ons. Enable free add-ons, start trials, or purchase lifetime unlocks.
          </p>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search add-ons..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
              <Tabs value={category} onValueChange={setCategory} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="stories">Stories</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="bundle">Bundles</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!currentOrgId ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Please select an organization to manage add-ons.</p>
            </CardContent>
          </Card>
        ) : addons === undefined ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading add-ons...</p>
            </CardContent>
          </Card>
        ) : addons.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No add-ons found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setCategory("all");
                  setSortBy("name");
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addons.map((addon: EnrichedAddon) => {
              const Icon = getAddonIcon(addon.uiPlacement?.icon);
              const status = getAddonStatus(addon);
              const daysLeft = getDaysUntilTrialEnd(addon.entitlement?.trialEnd);

              // Get pricing info
              const basePrice = addon.priceAmount ? formatPrice(addon.priceAmount, addon.priceCurrency) : null;
              const hasDiscount = addon.campaigns && addon.campaigns.length > 0;

              return (
                <Card key={addon._id} className={status === "expired" || status === "trial_expired" ? "opacity-75" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{addon.name}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            {addon.isFree ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                Free
                              </Badge>
                            ) : (
                              <>
                                {basePrice && (
                                  <Badge variant="outline">
                                    {hasDiscount && addon.campaigns?.[0] ? (
                                      <>
                                        <span className="line-through text-muted-foreground mr-1">{basePrice}</span>
                                        {addon.campaigns[0].discountType === "percentage" ? (
                                          `${addon.campaigns[0].discountValue}% off`
                                        ) : (
                                          formatPrice(addon.priceAmount! - addon.campaigns[0].discountValue, addon.priceCurrency)
                                        )}
                                      </>
                                    ) : (
                                      `One-time • ${basePrice}`
                                    )}
                                  </Badge>
                                )}
                              </>
                            )}
                            {status === "active" && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                Active
                              </Badge>
                            )}
                            {status === "trialing" && daysLeft !== null && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                                Trial • {daysLeft} days left
                              </Badge>
                            )}
                            {status === "trial_expired" && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                                Trial Ended
                              </Badge>
                            )}
                            {addon.entitlement?.lastPaymentStatus === "requires_payment_method" && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                Payment Failed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {status === "active" && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {addon.shortDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div className="flex flex-col gap-2">
                        {status === "not_enabled" && addon.isFree && (
                          <Button
                            onClick={() => handleEnableFree(addon._id)}
                            disabled={loadingAction === addon._id || !canManageModules}
                            className="w-full"
                          >
                            {loadingAction === addon._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Enable
                          </Button>
                        )}
                        {status === "not_enabled" && !addon.isFree && !addon.supportsTrial && (
                          <Button
                            onClick={() => handlePurchase(addon._id)}
                            disabled={loadingAction === addon._id}
                            className="w-full"
                          >
                            {loadingAction === addon._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Buy Now {basePrice && `• ${basePrice}`}
                          </Button>
                        )}
                        {status === "not_enabled" && !addon.isFree && addon.supportsTrial && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStartTrial(addon._id)}
                              disabled={loadingAction === addon._id || !canManageModules}
                              variant="outline"
                              className="flex-1"
                            >
                              {loadingAction === addon._id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Start Free Trial
                            </Button>
                            <Button
                              onClick={() => handlePurchase(addon._id)}
                              disabled={loadingAction === addon._id}
                              className="flex-1"
                            >
                              {loadingAction === addon._id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Buy {basePrice && `• ${basePrice}`}
                            </Button>
                          </div>
                        )}
                        {status === "trialing" && (
                          <Button
                            onClick={() => handlePurchase(addon._id, "trial")}
                            disabled={loadingAction === addon._id}
                            className="w-full"
                          >
                            {loadingAction === addon._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Buy to Keep {basePrice && `• ${basePrice}`}
                          </Button>
                        )}
                        {status === "trial_expired" && (
                          <Button
                            onClick={() => handlePurchase(addon._id)}
                            disabled={loadingAction === addon._id}
                            className="w-full"
                          >
                            {loadingAction === addon._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Buy to Continue {basePrice && `• ${basePrice}`}
                          </Button>
                        )}
                        {addon.entitlement?.lastPaymentStatus === "requires_payment_method" && (
                          <Button
                            onClick={() => handlePurchase(addon._id)}
                            disabled={loadingAction === addon._id}
                            variant="outline"
                            className="w-full"
                          >
                            {loadingAction === addon._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mr-2" />
                            )}
                            Retry Payment
                          </Button>
                        )}
                        {status === "active" && canManageModules && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Enabled</span>
                            <Switch
                              checked={addon.isEnabled}
                              onCheckedChange={() => handleToggle(addon._id)}
                              disabled={loadingAction === addon._id}
                            />
                          </div>
                        )}
                      </div>

                      {/* Additional info */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Version {addon.version}</span>
                          {addon.entitlement?.purchasedAt && (
                            <span>Purchased {new Date(addon.entitlement.purchasedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
