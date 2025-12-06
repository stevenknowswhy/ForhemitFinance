"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrg } from "../../contexts/OrgContext";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BillingSettingsProps {
  subscriptionTier?: any;
}

export function BillingSettings({ subscriptionTier }: BillingSettingsProps) {
  const { toast } = useToast();
  const { currentOrgId, userRole } = useOrg();

  const subscriptionData = useQuery(api.subscriptions.getOrgSubscription,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  const updateSubscription = useMutation(api.subscriptions.updateOrgSubscription);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleUpdatePaymentMethod = () => {
    // TODO: Integrate with Stripe Billing Portal
    toast({
      title: "Coming soon",
      description: "Payment method update will be available soon.",
    });
  };

  const handleChangePlan = () => {
    window.location.href = "/pricing";
  };

  const handleCancelSubscription = async () => {
    if (!currentOrgId || !subscriptionData?.subscription) return;

    setIsCancelling(true);
    try {
      await updateSubscription({
        orgId: currentOrgId,
        planId: subscriptionData.subscription.planId,
        status: "canceled",
        // Keep trial/renews dates as is, or set cancelAtPeriodEnd logic
      });

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled.",
      });
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewInvoices = () => {
    // TODO: Open Stripe Billing Portal
    toast({
      title: "Coming soon",
      description: "Billing history will be available soon.",
    });
  };

  if (!currentOrgId) return null;

  if (subscriptionData === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { subscription, plan } = subscriptionData || {};
  const planName = plan?.displayName || "Free Plan";
  const isOwnerOrAdmin = userRole === "ORG_OWNER" || userRole === "ORG_ADMIN";

  return (
    <div className="space-y-4 py-4">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{planName}</p>
                {subscription?.status && (
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                )}
              </div>
              {subscription?.renewsAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews: {new Date(subscription.renewsAt).toLocaleDateString()}
                </p>
              )}
              {subscription?.trialEndsAt && subscription.status === "trialing" && (
                <p className="text-sm text-amber-600 mt-1">
                  Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                </p>
              )}
            </div>
            {isOwnerOrAdmin && (
              <Button variant="outline" onClick={handleChangePlan}>
                Change Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
          <CardDescription>Update your credit card or payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Payment details managed via Stripe</p>
              </div>
            </div>
            {isOwnerOrAdmin && (
              <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleViewInvoices} className="w-full">
            View Invoices
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {isOwnerOrAdmin && subscription?.status === "active" && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Cancel Subscription</CardTitle>
            <CardDescription>
              Cancel your subscription. You'll retain access until the end of your billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Cancel Subscription?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                    Keep Subscription
                  </Button>
                  <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Subscription"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


