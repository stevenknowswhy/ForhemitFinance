"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, Trash2, AlertTriangle } from "lucide-react";

export function DataExportSettings() {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    // TODO: Implement data export
    toast({
      title: "Export started",
      description: `Your data is being exported as ${format.toUpperCase()}. You'll receive a download link when ready.`,
    });
  };

  const handleDownloadArchive = () => {
    // TODO: Implement full archive download
    toast({
      title: "Archive download",
      description: "Your full bookkeeping archive is being prepared. You'll receive a download link when ready.",
    });
  };

  const handleDeleteData = () => {
    // TODO: Implement data deletion request
    toast({
      title: "Deletion request submitted",
      description: "Your data deletion request has been submitted. You'll receive a confirmation email shortly.",
    });
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
          <CardDescription>Export your financial data in various formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleExport("csv")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleExport("excel")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleExport("pdf")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF Summary
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full Archive</CardTitle>
          <CardDescription>Download your complete bookkeeping archive</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleDownloadArchive}>
            <Download className="w-4 h-4 mr-2" />
            Download Full Archive
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Tokens</CardTitle>
          <CardDescription>Manage API tokens for advanced integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            API tokens allow you to programmatically access your data. This feature is coming soon.
          </p>
          <Button variant="outline" disabled>
            Manage API Tokens
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Data Deletion
          </CardTitle>
          <CardDescription>
            Request deletion of all your data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Request Data Deletion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete All Data?
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete all your financial data, transactions, accounts, and settings. This action cannot be undone. You'll receive a confirmation email before the deletion is processed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteData}>
                  Request Deletion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

