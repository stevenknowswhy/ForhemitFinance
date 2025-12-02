"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Address {
  _id?: Id<"addresses">;
  id?: string;
  type: "residential" | "business";
  streetAddress: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

interface AddressesSettingsProps {
  isBusinessPlan: boolean;
}

export function AddressesSettings({ isBusinessPlan }: AddressesSettingsProps) {
  const { toast } = useToast();
  const addressesData = useQuery(api.addresses.getAddresses);
  const addAddress = useMutation(api.addresses.addAddress);
  const updateAddress = useMutation(api.addresses.updateAddress);
  const deleteAddress = useMutation(api.addresses.deleteAddress);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Address, "id">>({
    type: "residential",
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      type: "residential",
      streetAddress: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      streetAddress: address.streetAddress,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  // Load addresses from backend
  useEffect(() => {
    if (addressesData) {
      setAddresses(addressesData.map((addr: any) => ({
        _id: addr._id,
        id: addr._id,
        type: addr.type,
        streetAddress: addr.streetAddress,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        isDefault: addr.setAsDefaultAt !== null && addr.setAsDefaultAt !== undefined,
      })));
    }
  }, [addressesData]);

  const handleDeleteAddress = async (id: string) => {
    const address = addresses.find(a => (a._id || a.id) === id);
    if (!address?._id) {
      toast({
        title: "Error",
        description: "Address not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteAddress({ id: address._id });
      toast({
        title: "Address deleted",
        description: "The address has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!formData.streetAddress || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { isDefault, ...addressFields } = formData;
      const addressPayload = {
        ...addressFields,
        setAsDefaultAt: isDefault ? Date.now() : undefined,
      };

      if (editingAddress?._id) {
        // Update existing
        await updateAddress({
          id: editingAddress._id,
          ...addressPayload,
        });
        toast({
          title: "Address updated",
          description: "The address has been updated.",
        });
      } else {
        // Add new
        await addAddress(addressPayload);
        toast({
          title: "Address added",
          description: "The address has been added.",
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      {isBusinessPlan ? (
        <div className="space-y-4">
          {/* Business Address Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Business Address</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Information</CardTitle>
                <CardDescription>
                  Add your business address and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessStreet">Street Address</Label>
                  <Input id="businessStreet" placeholder="123 Business St" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress2">Address Line 2</Label>
                  <Input id="businessAddress2" placeholder="Suite 100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessCity">City</Label>
                    <Input id="businessCity" placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessState">State</Label>
                    <Input id="businessState" placeholder="State" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessZip">ZIP Code</Label>
                  <Input id="businessZip" placeholder="12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone Number</Label>
                  <Input id="businessPhone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Business Website</Label>
                  <Input id="businessWebsite" type="url" placeholder="https://example.com" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Residential Address Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Residential Address</h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="residentialStreet">Street Address</Label>
                  <Input id="residentialStreet" placeholder="123 Home St" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentialAddress2">Address Line 2</Label>
                  <Input id="residentialAddress2" placeholder="Apt 4B" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="residentialCity">City</Label>
                    <Input id="residentialCity" placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="residentialState">State</Label>
                    <Input id="residentialState" placeholder="State" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentialZip">ZIP Code</Label>
                  <Input id="residentialZip" placeholder="12345" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div>
          {/* Personal Plan - Residential Address Only */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Residential Address</CardTitle>
              <CardDescription>
                Your primary address for personal use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" placeholder="123 Main St" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input id="address2" placeholder="Apt 4B" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="State" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="12345" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Addresses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Additional Addresses</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddAddress} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  Enter the address details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dialogStreet">Street Address</Label>
                  <Input
                    id="dialogStreet"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, streetAddress: e.target.value })
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialogAddress2">Address Line 2</Label>
                  <Input
                    id="dialogAddress2"
                    value={formData.addressLine2}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine2: e.target.value })
                    }
                    placeholder="Apt 4B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dialogCity">City</Label>
                    <Input
                      id="dialogCity"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialogState">State</Label>
                    <Input
                      id="dialogState"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialogZip">ZIP Code</Label>
                  <Input
                    id="dialogZip"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="12345"
                  />
                </div>
                <Button onClick={handleSaveAddress} className="w-full">
                  {editingAddress ? "Update Address" : "Add Address"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No additional addresses added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((address: any) => (
              <Card key={address._id || address.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{address.streetAddress}</p>
                      {address.addressLine2 && (
                        <p className="text-sm text-muted-foreground">
                          {address.addressLine2}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <span className="text-xs text-muted-foreground capitalize">
                        {address.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address._id || address.id || "")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

