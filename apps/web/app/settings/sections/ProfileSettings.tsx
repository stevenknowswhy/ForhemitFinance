"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  user: any; // Clerk user object
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { toast } = useToast();
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.emailAddresses[0]?.emailAddress || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumbers[0]?.phoneNumber || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      const formData: ProfileFormData = {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
      };

      // Validate
      profileSchema.parse(formData);

      setIsSaving(true);
      await updateProfile({
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Avatar placeholder for future use */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl font-semibold text-muted-foreground">
            {firstName?.[0] || lastName?.[0] || "U"}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avatar</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled // Email managed by Clerk
          />
          <p className="text-xs text-muted-foreground">
            Email is managed by your authentication provider
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

