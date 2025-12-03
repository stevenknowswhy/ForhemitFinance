"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrg } from "../../contexts/OrgContext";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Trash2, Shield, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TeamSettings() {
  const { toast } = useToast();
  const { currentOrgId, userRole } = useOrg();

  const members = useQuery(api.memberships.listMembers,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  const inviteMember = useMutation(api.memberships.inviteMember);
  const updateMemberRole = useMutation(api.memberships.updateMemberRole);
  const removeMember = useMutation(api.memberships.removeMember);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ORG_ADMIN" | "BOOKKEEPER" | "VIEWER">("VIEWER");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!currentOrgId) return;

    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({
        title: "Validation error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember({
        orgId: currentOrgId,
        email: inviteEmail,
        role: inviteRole,
      });

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      });

      setInviteEmail("");
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (membershipId: any) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember({ membershipId });
      toast({
        title: "Member removed",
        description: "The team member has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (membershipId: any, newRole: any) => {
    try {
      await updateMemberRole({
        membershipId,
        newRole,
      });
      toast({
        title: "Role updated",
        description: "The team member's role has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ORG_OWNER": return "Owner";
      case "ORG_ADMIN": return "Admin";
      case "BOOKKEEPER": return "Bookkeeper";
      case "VIEWER": return "Viewer";
      default: return role;
    }
  };

  if (!currentOrgId) return null;

  const canManageTeam = userRole === "ORG_OWNER" || userRole === "ORG_ADMIN";

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </div>
            {canManageTeam && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to collaborate on your financial data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">Email Address</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inviteRole">Role</Label>
                      <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                        <SelectTrigger id="inviteRole">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                          <SelectItem value="BOOKKEEPER">Bookkeeper</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleInvite} className="w-full" disabled={isInviting}>
                      {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!members ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members found.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name || member.email}</p>
                      {member.status === "invited" && (
                        <Badge variant="secondary" className="text-xs">Invited</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageTeam && member.role !== "ORG_OWNER" ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleChangeRole(member._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                          <SelectItem value="BOOKKEEPER">Bookkeeper</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{getRoleLabel(member.role)}</Badge>
                    )}

                    {canManageTeam && member.role !== "ORG_OWNER" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Access Audit
          </CardTitle>
          <CardDescription>View audit log of team access and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Access audit log coming soon. This will show a history of team member actions and access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


