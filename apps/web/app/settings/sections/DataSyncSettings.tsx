"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Link2, Unlink, Settings, Database, Trash2, RotateCcw, AlertTriangle, Sparkles } from "lucide-react";
import MockPlaidLink from "@tests/mocks/components/MockPlaidLink";

export function DataSyncSettings() {
  const { toast } = useToast();
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [duplicateHandling, setDuplicateHandling] = useState("skip");
  const [isDeleteTransactionsDialogOpen, setIsDeleteTransactionsDialogOpen] = useState(false);
  const [isRefreshAppDialogOpen, setIsRefreshAppDialogOpen] = useState(false);
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false);
  const [isRefreshingApp, setIsRefreshingApp] = useState(false);

  const institutions = useQuery(api.plaid.getUserInstitutions) || [];
  const deleteAllTransactions = useMutation(api.transactions.deleteAllTransactions);
  const refreshApp = useMutation(api.users.refreshApp);
  const generateMockData = useAction(api.mock_data.generateThreeMonthsMockData);
  const mockDataStatus = useQuery(api.mock_data.getMockDataStatus);
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);
  const [isGenerateMockDataDialogOpen, setIsGenerateMockDataDialogOpen] = useState(false);
  const [includeBusiness, setIncludeBusiness] = useState(true);
  const [includePersonal, setIncludePersonal] = useState(true);

  const handleReconnect = (institutionId: string) => {
    // TODO: Implement Plaid reconnection
    toast({
      title: "Reconnecting...",
      description: "Please complete the connection process.",
    });
  };

  const handleDisconnect = (institutionId: string) => {
    // TODO: Implement Plaid disconnection
    toast({
      title: "Disconnected",
      description: "Bank account has been disconnected.",
    });
  };

  const handleRefresh = (institutionId: string) => {
    // TODO: Trigger manual sync
    toast({
      title: "Syncing...",
      description: "Refreshing transactions from bank account.",
    });
  };

  const handleDeleteAllTransactions = async () => {
    setIsDeletingTransactions(true);
    try {
      const result = await deleteAllTransactions({});
      toast({
        title: "Transactions deleted",
        description: `Successfully deleted ${result.deletedCount} transaction(s) and associated data.`,
      });
      setIsDeleteTransactionsDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to delete transactions:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Failed to delete transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTransactions(false);
    }
  };

  const handleRefreshApp = async () => {
    setIsRefreshingApp(true);
    try {
      const result = await refreshApp({});
      toast({
        title: "App refreshed",
        description: "All data has been deleted and the app has been reset to defaults. Please refresh the page.",
      });
      setIsRefreshAppDialogOpen(false);
      // Reload the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to refresh app:", error);
      toast({
        title: "Refresh failed",
        description: error?.message || "Failed to refresh app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingApp(false);
    }
  };

  const handleGenerateMockData = async () => {
    if (!includeBusiness && !includePersonal) {
      toast({
        title: "Selection required",
        description: "Please select at least one data type (Business or Personal) to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingMockData(true);
    try {
      const result = await generateMockData({
        includeBusiness,
        includePersonal,
      });

      if (result.success) {
        toast({
          title: "Mock data generated",
          description: result.message || `Successfully generated ${result.results.business.transactionsGenerated + result.results.personal.transactionsGenerated} transactions.`,
        });
        setIsGenerateMockDataDialogOpen(false);
      } else {
        // If success is false, the error is in the message or we throw a generic error
        throw new Error("Mock data generation failed");
      }
    } catch (error: any) {
      console.error("Failed to generate mock data:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to generate mock data. Please try again.";
      if (error?.message) {
        if (error.message.includes("User not found")) {
          errorMessage = "Authentication error. Please refresh the page and try again.";
        } else if (error.message.includes("accounts")) {
          errorMessage = "Account setup error. Please ensure you have completed onboarding.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMockData(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Connected Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Connected Bank Accounts
          </CardTitle>
          <CardDescription>Manage your connected bank accounts via Plaid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {institutions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                No bank accounts connected yet.
              </p>
              <MockPlaidLink />
            </div>
          ) : (
            institutions.map((institution: any) => (
              <div
                key={institution._id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{institution.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {institution.syncStatus}
                  </p>
                  {institution.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(institution.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefresh(institution._id)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReconnect(institution._id)}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(institution._id)}
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {institutions.length > 0 && (
            <div className="pt-4 border-t">
              <MockPlaidLink />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sync Settings
          </CardTitle>
          <CardDescription>Configure automatic synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backgroundSync">Background Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync transactions in the background
              </p>
            </div>
            <Switch
              id="backgroundSync"
              checked={backgroundSync}
              onCheckedChange={setBackgroundSync}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categorization Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Categorization Rules</CardTitle>
          <CardDescription>
            Set up automatic categorization rules for transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCategorize">Auto-Categorize Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize transactions based on merchant names
              </p>
            </div>
            <Switch
              id="autoCategorize"
              checked={autoCategorize}
              onCheckedChange={setAutoCategorize}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicateHandling">Duplicate Transaction Handling</Label>
            <select
              id="duplicateHandling"
              value={duplicateHandling}
              onChange={(e) => setDuplicateHandling(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="skip">Skip duplicates</option>
              <option value="merge">Merge duplicates</option>
              <option value="flag">Flag for review</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Development & Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5" />
            Development & Testing Tools
          </CardTitle>
          <CardDescription>Tools for testing and managing your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Mock Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Add Mock Transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Generate sample transactions for testing purposes
                </p>
              </div>
              <MockPlaidLink />
            </div>
          </div>

          {/* Generate 3 Months Mock Data */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Generate 3 Months Mock Data</Label>
                <p className="text-sm text-muted-foreground">
                  Generate 3 months of business and personal transactions with proper double-entry accounting
                </p>
                {mockDataStatus && mockDataStatus.hasData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {mockDataStatus.totalTransactions} transactions, {mockDataStatus.totalEntries} entries
                  </p>
                )}
              </div>
              <Dialog open={isGenerateMockDataDialogOpen} onOpenChange={setIsGenerateMockDataDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate 3 Months Mock Data</DialogTitle>
                    <DialogDescription>
                      This will generate 3 months (90 days) of mock transactions with proper double-entry accounting entries.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="includeBusiness">Include Business Transactions</Label>
                        <p className="text-sm text-muted-foreground">
                          Generate business revenue, expenses, and transactions
                        </p>
                      </div>
                      <Switch
                        id="includeBusiness"
                        checked={includeBusiness}
                        onCheckedChange={setIncludeBusiness}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="includePersonal">Include Personal Transactions</Label>
                        <p className="text-sm text-muted-foreground">
                          Generate personal income, expenses, and transactions
                        </p>
                      </div>
                      <Switch
                        id="includePersonal"
                        checked={includePersonal}
                        onCheckedChange={setIncludePersonal}
                      />
                    </div>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium mb-1">What will be generated:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Raw transactions (transactions_raw)</li>
                        <li>Proposed entries (entries_proposed)</li>
                        <li>Approved entries (entries_final)</li>
                        <li>Entry lines with proper double-entry (entry_lines)</li>
                        <li>Personal accounts (if missing)</li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsGenerateMockDataDialogOpen(false)}
                      disabled={isGeneratingMockData}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGenerateMockData}
                      disabled={isGeneratingMockData || (!includeBusiness && !includePersonal)}
                    >
                      {isGeneratingMockData ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Mock Data
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            {/* Delete All Transactions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Delete All Transactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all transactions and associated data
                  </p>
                </div>
                <Dialog open={isDeleteTransactionsDialogOpen} onOpenChange={setIsDeleteTransactionsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Delete All Transactions?
                      </DialogTitle>
                      <DialogDescription>
                        This will permanently delete all your transactions, proposed entries, and associated receipts. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDeleteTransactionsDialogOpen(false)}
                        disabled={isDeletingTransactions}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAllTransactions}
                        disabled={isDeletingTransactions}
                      >
                        {isDeletingTransactions ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All Transactions
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Complete App Refresh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Complete App Refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Delete all data and reset the app to a fresh state
                  </p>
                </div>
                <Dialog open={isRefreshAppDialogOpen} onOpenChange={setIsRefreshAppDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh App
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Complete App Refresh?
                      </DialogTitle>
                      <DialogDescription className="space-y-2">
                        <p>
                          This will permanently delete <strong>ALL</strong> your data including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>All transactions and entries</li>
                          <li>All accounts and bank connections</li>
                          <li>All receipts and documents</li>
                          <li>Business profiles and addresses</li>
                          <li>Professional contacts</li>
                          <li>Goals, budgets, and AI insights</li>
                          <li>All settings and preferences (reset to defaults)</li>
                        </ul>
                        <p className="pt-2">
                          <strong>This action cannot be undone!</strong> The app will be reset to a completely fresh state as if you just signed up.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsRefreshAppDialogOpen(false)}
                        disabled={isRefreshingApp}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRefreshApp}
                        disabled={isRefreshingApp}
                      >
                        {isRefreshingApp ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Refresh App
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

