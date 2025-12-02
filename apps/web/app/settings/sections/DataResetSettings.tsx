"use client";

/**
 * Data & Reset Settings Component
 * Handles sample data generation and data reset operations
 */

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Database, Trash2, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DataResetSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const { signOut } = useClerk();

  // Sample Data Generation
  const generateMockData = useAction(api.mock_data.generateThreeMonthsMockData);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeBusiness, setIncludeBusiness] = useState(true);
  const [includePersonal, setIncludePersonal] = useState(true);

  // Reset Transactions Only
  const resetTransactions = useMutation(api.data_reset.resetTransactionsOnly);
  const [isResetTransactionsDialogOpen, setIsResetTransactionsDialogOpen] = useState(false);
  const [isResettingTransactions, setIsResettingTransactions] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [understandDelete, setUnderstandDelete] = useState(false);

  // Factory Reset
  const factoryReset = useMutation(api.data_reset.factoryReset);
  const [isFactoryResetDialogOpen, setIsFactoryResetDialogOpen] = useState(false);
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);
  const [factoryResetConfirmation, setFactoryResetConfirmation] = useState("");
  const [understandFactoryReset, setUnderstandFactoryReset] = useState(false);

  // Handle Sample Data Generation
  const handleGenerateSampleData = async () => {
    if (!includeBusiness && !includePersonal) {
      toast({
        title: "Selection required",
        description: "Please select at least one data type (Business or Personal) to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMockData({
        includeBusiness,
        includePersonal,
      });

      if (result.success) {
        toast({
          title: "Sample data generated",
          description: result.message || "Successfully generated sample data. You can now explore the app using demo transactions.",
        });
        setIsGenerateDialogOpen(false);
      } else {
        throw new Error("Sample data generation failed");
      }
    } catch (error: any) {
      console.error("Failed to generate sample data:", error);
      toast({
        title: "Generation failed",
        description: error?.message || "Failed to generate sample data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Reset Transactions Only
  const handleResetTransactions = async () => {
    if (deleteConfirmation !== "DELETE" || !understandDelete) {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE and check the confirmation box.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingTransactions(true);
    try {
      const result = await resetTransactions({});

      if (result.success) {
        toast({
          title: "Transactions cleared",
          description: `Successfully deleted ${result.deleted.transactions} transactions and ${result.deleted.proposedEntries + result.deleted.finalEntries} entries.`,
        });
        setIsResetTransactionsDialogOpen(false);
        setDeleteConfirmation("");
        setUnderstandDelete(false);
      } else {
        throw new Error("Failed to reset transactions");
      }
    } catch (error: any) {
      console.error("Failed to reset transactions:", error);
      toast({
        title: "Reset failed",
        description: error?.message || "Failed to clear transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingTransactions(false);
    }
  };

  // Handle Factory Reset
  const handleFactoryReset = async () => {
    if (factoryResetConfirmation !== "FORHEMIT" || !understandFactoryReset) {
      toast({
        title: "Confirmation required",
        description: "Please type FORHEMIT and check the confirmation box.",
        variant: "destructive",
      });
      return;
    }

    setIsFactoryResetting(true);
    try {
      const result = await factoryReset({});

      if (result.success) {
        toast({
          title: "Factory reset complete",
          description: "All data has been cleared. You will be signed out.",
        });

        // Wait a moment for the toast to show, then sign out
        setTimeout(async () => {
          await signOut();
          router.push("/sign-in");
        }, 2000);
      } else {
        throw new Error("Failed to perform factory reset");
      }
    } catch (error: any) {
      console.error("Failed to factory reset:", error);
      toast({
        title: "Reset failed",
        description: error?.message || "Failed to perform factory reset. Please try again.",
        variant: "destructive",
      });
      setIsFactoryResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Sample Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Add Sample Data
          </CardTitle>
          <CardDescription>
            Quickly populate your account with sample transactions so you can explore the app without manually entering everything.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will insert demo transactions into your current account. You can delete them later via reset or manual cleanup.
          </p>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Add Sample Data
          </Button>
        </CardContent>
      </Card>

      {/* Reset Transactions Only Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Clear All Transactions
          </CardTitle>
          <CardDescription>
            Delete all your financial transactions but keep your settings, categories, and connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will permanently delete all your transactions. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={() => setIsResetTransactionsDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Transactions
          </Button>
        </CardContent>
      </Card>

      {/* Factory Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Factory Reset
          </CardTitle>
          <CardDescription>
            Return the app to its original state by deleting all data, settings, and configurations. This is permanent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription>
              This will permanently delete all of your data, settings, and configurations. This cannot be undone. You will be signed out after the reset.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={() => setIsFactoryResetDialogOpen(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Factory Reset App
          </Button>
        </CardContent>
      </Card>

      {/* Generate Sample Data Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sample Data?</DialogTitle>
            <DialogDescription>
              This will insert demo transactions into your current account. You can delete them later via reset or manual cleanup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBusiness"
                checked={includeBusiness}
                onCheckedChange={(checked) => setIncludeBusiness(checked === true)}
              />
              <Label htmlFor="includeBusiness" className="cursor-pointer">
                Include Business Data
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePersonal"
                checked={includePersonal}
                onCheckedChange={(checked) => setIncludePersonal(checked === true)}
              />
              <Label htmlFor="includePersonal" className="cursor-pointer">
                Include Personal Data
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateSampleData} disabled={isGenerating || (!includeBusiness && !includePersonal)}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Add Sample Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Transactions Dialog */}
      <Dialog open={isResetTransactionsDialogOpen} onOpenChange={setIsResetTransactionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Clear All Transactions?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your transactions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                All transactions, entries, and related financial data will be permanently deleted. Your settings, categories, and account connections will be preserved.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirmation">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                disabled={isResettingTransactions}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understandDelete"
                checked={understandDelete}
                onCheckedChange={(checked) => setUnderstandDelete(checked === true)}
                disabled={isResettingTransactions}
              />
              <Label htmlFor="understandDelete" className="cursor-pointer">
                I understand this action cannot be undone
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetTransactionsDialogOpen(false);
                setDeleteConfirmation("");
                setUnderstandDelete(false);
              }}
              disabled={isResettingTransactions}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetTransactions}
              disabled={
                isResettingTransactions ||
                deleteConfirmation !== "DELETE" ||
                !understandDelete
              }
            >
              {isResettingTransactions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Transactions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Factory Reset Dialog */}
      <Dialog open={isFactoryResetDialogOpen} onOpenChange={setIsFactoryResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Factory Reset Forhemit Finance?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all of your data, settings, and configurations. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription>
                All data including transactions, accounts, settings, preferences, categories, connections, and configurations will be permanently deleted. You will be signed out after the reset.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="factoryResetConfirmation">
                Type <strong>FORHEMIT</strong> to confirm:
              </Label>
              <Input
                id="factoryResetConfirmation"
                value={factoryResetConfirmation}
                onChange={(e) => setFactoryResetConfirmation(e.target.value)}
                placeholder="FORHEMIT"
                disabled={isFactoryResetting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understandFactoryReset"
                checked={understandFactoryReset}
                onCheckedChange={(checked) => setUnderstandFactoryReset(checked === true)}
                disabled={isFactoryResetting}
              />
              <Label htmlFor="understandFactoryReset" className="cursor-pointer">
                I understand this will erase all of my data
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFactoryResetDialogOpen(false);
                setFactoryResetConfirmation("");
                setUnderstandFactoryReset(false);
              }}
              disabled={isFactoryResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFactoryReset}
              disabled={
                isFactoryResetting ||
                factoryResetConfirmation !== "FORHEMIT" ||
                !understandFactoryReset
              }
            >
              {isFactoryResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
