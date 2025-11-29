"use client";

/**
 * Settings Page
 * Comprehensive settings organized into category cards with accordion sections
 */

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DesktopNavigation } from "../components/DesktopNavigation";
import { BottomNavigation } from "../components/BottomNavigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "./sections/ProfileSettings";
import { AddressesSettings } from "./sections/AddressesSettings";
import { BillingSettings } from "./sections/BillingSettings";
import { ThemeSettings } from "./sections/ThemeSettings";
import { SecuritySettings } from "./sections/SecuritySettings";
import { DataSyncSettings } from "./sections/DataSyncSettings";
import { AIPersonalizationSettings } from "./sections/AIPersonalizationSettings";
import { AccountingPreferencesSettings } from "./sections/AccountingPreferencesSettings";
import { NotificationPreferencesSettings } from "./sections/NotificationPreferencesSettings";
import { DataExportSettings } from "./sections/DataExportSettings";
import { TeamSettings } from "./sections/TeamSettings";
import { IntegrationsSettings } from "./sections/IntegrationsSettings";
import { PrivacySettings } from "./sections/PrivacySettings";
import { AppDisplaySettings } from "./sections/AppDisplaySettings";
import { BusinessProfileSettings } from "./sections/BusinessProfileSettings";
import { ProfessionalNetworkSettings } from "./sections/ProfessionalNetworkSettings";
import { 
  User, 
  Shield, 
  CreditCard, 
  Palette, 
  Database, 
  Sparkles, 
  Bell, 
  Building2, 
  Plug, 
  Eye,
  FileText,
  Settings2,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check onboarding status
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const currentUser = useQuery(api.users.getCurrentUser);

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

  if (!onboardingStatus?.hasCompletedOnboarding) {
    return null;
  }

  const subscriptionTier = currentUser?.subscriptionTier || "solo";
  const isBusinessPlan = subscriptionTier === "light" || subscriptionTier === "pro";

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <DesktopNavigation />

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, preferences, and integrations
          </p>
        </div>

        <Accordion type="multiple" className="w-full space-y-4">
          {/* Category 1: Account */}
          <AccordionItem value="account" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <User className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Account
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Manage your profile information and addresses
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <Accordion type="multiple" className="w-full space-y-2">
                    <AccordionItem value="profile" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Profile
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <ProfileSettings user={user} />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="addresses" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Addresses
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <AddressesSettings isBusinessPlan={isBusinessPlan} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 1.5: Business Profile (Available to All Users) */}
          <AccordionItem value="business-profile" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <FileText className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Business Profile
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Your business identity and compliance information - essential for banks, lenders, and investors
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <BusinessProfileSettings />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 2: Security & Privacy */}
          <AccordionItem value="security-privacy" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <Shield className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Security & Privacy
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Protect your account and control your privacy settings
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <Accordion type="multiple" className="w-full space-y-2">
                    <AccordionItem value="security" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Security & Login
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <SecuritySettings />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="privacy" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Privacy Controls
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <PrivacySettings />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 3: Billing */}
          <AccordionItem value="billing" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <CreditCard className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Billing & Subscription
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Manage your subscription, payment methods, and billing history
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <BillingSettings subscriptionTier={subscriptionTier} />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 4: Appearance */}
          <AccordionItem value="appearance" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <Palette className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Appearance
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Customize how the app looks and feels
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <Accordion type="multiple" className="w-full space-y-2">
                    <AccordionItem value="theme" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Theme
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <ThemeSettings />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="display" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        Display & Behavior
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <AppDisplaySettings />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 5: Notifications */}
          <AccordionItem value="notifications" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <Bell className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <NotificationPreferencesSettings />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 8: Business (Business Plan Only) */}
          {isBusinessPlan && (
            <AccordionItem value="business" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
              <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                  <CardHeader className="flex-1 p-0">
                    <CardTitle className="flex items-center gap-2 text-xl group">
                      <Building2 className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                      Business
                    </CardTitle>
                    <CardDescription className="group-hover:text-foreground/80 transition-colors">
                      Business-specific settings and team management
                    </CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="px-6 pb-6 pt-0">
                    <Accordion type="multiple" className="w-full space-y-2">
                      <AccordionItem value="business-profile" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Business Profile</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 pb-4">
                          <BusinessProfileSettings />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="accounting" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                          Accounting Preferences
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 pb-4">
                          <AccountingPreferencesSettings />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="team" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                          Team & Collaboration
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 pb-4">
                          <TeamSettings />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {/* Category 9: Accounting (Personal Plan) */}
          {!isBusinessPlan && (
            <AccordionItem value="accounting" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
              <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                  <CardHeader className="flex-1 p-0">
                    <CardTitle className="flex items-center gap-2 text-xl group">
                      <Building2 className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                      Accounting Preferences
                    </CardTitle>
                    <CardDescription className="group-hover:text-foreground/80 transition-colors">
                      Configure your accounting method and preferences
                    </CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="px-6 pb-6 pt-0">
                    <AccountingPreferencesSettings />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {/* Category 10: Integrations */}
          <AccordionItem value="integrations" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <Plug className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Integrations
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Connect third-party services to enhance your workflow
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <IntegrationsSettings />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Category 11: Advanced */}
          <AccordionItem value="advanced" className="border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
            <Card className="border-0 shadow-none bg-card/50 hover:bg-card transition-colors duration-200">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>div>svg]:rotate-180">
                <CardHeader className="flex-1 p-0">
                  <CardTitle className="flex items-center gap-2 text-xl group">
                    <Settings2 className="w-6 h-6 transition-all duration-200 group-hover:text-primary" />
                    Advanced
                  </CardTitle>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors">
                    Advanced settings, data management, AI automation, and professional network
                  </CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <Accordion type="multiple" className="w-full space-y-2">
                    <AccordionItem value="data-management" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>Data Management</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <Accordion type="multiple" className="w-full space-y-2">
                          <AccordionItem value="data-sync" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline text-sm">
                              Data Sync & Bank Connections
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                              <DataSyncSettings />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="data-export" className="border-none border-t">
                            <AccordionTrigger className="py-2 hover:no-underline text-sm">
                              Data Export & Ownership
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                              <DataExportSettings />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ai-automation" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span>AI & Automation</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <AIPersonalizationSettings />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="professional-network" className="border border-gray-200 dark:border-gray-700 rounded-md px-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                      <AccordionTrigger className="py-3 hover:no-underline hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          <span>Professional Network</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4">
                        <ProfessionalNetworkSettings />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation />
    </div>
  );
}
