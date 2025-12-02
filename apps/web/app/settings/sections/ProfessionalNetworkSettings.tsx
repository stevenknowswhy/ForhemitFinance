"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Upload, Star } from "lucide-react";

interface ProfessionalContact {
  _id?: Id<"professional_contacts">;
  id?: string;
  contactType: string;
  category?: string;
  name: string;
  firmCompany?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  isPrimary?: boolean;
  tags?: string[];
}

const CONTACT_CATEGORIES = {
  finance: [
    "Banking Manager",
    "Business Banker",
    "Accountant / CPA",
    "Bookkeeper",
    "Fractional CFO",
    "Lender",
    "Financial Advisor",
  ],
  legal: [
    "Attorney",
    "Corporate Counsel",
    "Employment Attorney",
    "Tax Attorney",
    "Registered Agent",
  ],
  operations: [
    "Insurance Broker",
    "IT Provider",
    "Cybersecurity Consultant",
    "HR Consultant",
    "Payroll Provider Contact",
  ],
  strategy: [
    "Grant Writer",
    "Business Coach",
    "Mentor",
    "Investor Contact",
  ],
  other: [
    "Tax Preparer",
    "Marketing Agency Contact",
    "Procurement Officer",
    "Emergency Vendor",
    "Other",
  ],
};

const ALL_CONTACT_TYPES = [
  ...CONTACT_CATEGORIES.finance,
  ...CONTACT_CATEGORIES.legal,
  ...CONTACT_CATEGORIES.operations,
  ...CONTACT_CATEGORIES.strategy,
  ...CONTACT_CATEGORIES.other,
];

export function ProfessionalNetworkSettings() {
  const { toast } = useToast();
  const contactsData = useQuery(api.professionalContacts.getProfessionalContacts);
  const addContact = useMutation(api.professionalContacts.addProfessionalContact);
  const updateContact = useMutation(api.professionalContacts.updateProfessionalContact);
  const deleteContact = useMutation(api.professionalContacts.deleteProfessionalContact);
  
  const [contacts, setContacts] = useState<ProfessionalContact[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const saveTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Load contacts from backend
  useEffect(() => {
    if (contactsData) {
      setContacts(contactsData.map((contact: any) => ({
        _id: contact._id,
        id: contact._id,
        contactType: contact.contactType,
        category: contact.category,
        name: contact.name,
        firmCompany: contact.firmCompany,
        phone: contact.phone,
        email: contact.email,
        website: contact.website,
        notes: contact.notes,
        isPrimary: contact.setAsPrimaryAt !== null && contact.setAsPrimaryAt !== undefined,
        tags: contact.tags,
      })));
    }
  }, [contactsData]);

  const handleAddContact = async () => {
    try {
      await addContact({
        contactType: "",
        name: "",
      });
      toast({
        title: "Contact added",
        description: "A new contact has been added. Please fill in the details.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveContact = async (id: string) => {
    const contact = contacts.find(c => (c._id || c.id) === id);
    if (!contact?._id) {
      toast({
        title: "Error",
        description: "Contact not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteContact({ id: contact._id });
      toast({
        title: "Contact removed",
        description: "The contact has been removed from your network.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactChange = async (id: string, field: keyof ProfessionalContact, value: any) => {
    const contact = contacts.find(c => (c._id || c.id) === id);
    if (!contact?._id) return;

    // Auto-set category based on contact type
    let category = contact.category;
    if (field === "contactType") {
      for (const [cat, types] of Object.entries(CONTACT_CATEGORIES)) {
        if (types.includes(value)) {
          category = cat;
          break;
        }
      }
    }

    // Clear existing timeout for this contact
    if (saveTimeoutRef.current[id]) {
      clearTimeout(saveTimeoutRef.current[id]);
    }

    // Debounce the save and toast notification
    saveTimeoutRef.current[id] = setTimeout(async () => {
      if (!contact._id) return;
      try {
        const updatePayload: any = {
          id: contact._id,
          [field]: value,
          ...(field === "contactType" && category ? { category } : {}),
        };
        
        // Convert isPrimary boolean to setAsPrimaryAt timestamp
        if (field === "isPrimary") {
          updatePayload.setAsPrimaryAt = value ? Date.now() : null;
          delete updatePayload.isPrimary;
        }
        
        await updateContact(updatePayload);
        
        // Only show toast for important fields to avoid spam
        const importantFields = ["contactType", "name", "isPrimary"];
        if (importantFields.includes(field)) {
          toast({
            title: "Contact updated",
            description: "Your changes have been saved.",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update contact. Please try again.",
          variant: "destructive",
        });
      }
    }, 1000); // Wait 1 second after last change before saving and showing toast
  };

  const handleTogglePrimary = async (id: string, contactType: string) => {
    const contact = contacts.find(c => (c._id || c.id) === id);
    if (!contact?._id) return;

      try {
        const newIsPrimary = !contact.isPrimary;
        await updateContact({
          id: contact._id,
          setAsPrimaryAt: newIsPrimary ? Date.now() : null,
        });
        toast({
          title: "Contact updated",
          description: contact.isPrimary 
            ? "Contact is no longer marked as primary." 
            : "Contact marked as primary.",
        });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (id: string) => {
    // TODO: Implement file upload
    toast({
      title: "File upload",
      description: "File upload feature coming soon.",
    });
  };

  const filteredContacts = selectedCategory === "all"
    ? contacts
    : contacts.filter((c: any) => c.category === selectedCategory);

  const getContactTypeCategory = (type: string): string => {
    for (const [cat, types] of Object.entries(CONTACT_CATEGORIES)) {
      if (types.includes(type)) return cat;
    }
    return "other";
  };

  return (
    <div className="space-y-4 py-4">
      {/* Header with Add Button and Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Professional Contacts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your network of professional contacts - bankers, accountants, attorneys, and more
          </p>
        </div>
        <Button onClick={handleAddContact} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Category Filter */}
      {contacts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm">Filter by category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="legal">Legal & Compliance</SelectItem>
              <SelectItem value="operations">Operations & Risk</SelectItem>
              <SelectItem value="strategy">Strategy & Growth</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground mb-4">
            No professional contacts added yet.
          </p>
          <Button onClick={handleAddContact} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Contact
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact: any) => (
            <Card key={contact._id || contact.id} className="p-6 border-2">
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Select
                    value={contact.contactType}
                    onValueChange={(value) => handleContactChange(contact._id || contact.id || "", "contactType", value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select contact type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_CATEGORIES.finance.map((type: any) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      {CONTACT_CATEGORIES.legal.map((type: any) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      {CONTACT_CATEGORIES.operations.map((type: any) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      {CONTACT_CATEGORIES.strategy.map((type: any) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      {CONTACT_CATEGORIES.other.map((type: any) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contact.contactType && (
                    <Button
                      type="button"
                      variant={contact.isPrimary ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTogglePrimary(contact._id || contact.id || "", contact.contactType)}
                      className="gap-1"
                    >
                      <Star className={`w-3 h-3 ${contact.isPrimary ? "fill-current" : ""}`} />
                      Primary
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContact(contact._id || contact.id || "")}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${contact._id || contact.id}`}>Name</Label>
                  <Input
                    id={`name-${contact._id || contact.id}`}
                    value={contact.name}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "name", e.target.value)}
                    placeholder="Contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`firm-${contact._id || contact.id}`}>Firm / Company</Label>
                  <Input
                    id={`firm-${contact.id}`}
                    value={contact.firmCompany}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "firmCompany", e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${contact._id || contact.id}`}>Phone</Label>
                  <Input
                    id={`phone-${contact.id}`}
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${contact._id || contact.id}`}>Email</Label>
                  <Input
                    id={`email-${contact.id}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`website-${contact._id || contact.id}`}>Website</Label>
                  <Input
                    id={`website-${contact.id}`}
                    type="url"
                    value={contact.website}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`notes-${contact._id || contact.id}`}>Notes</Label>
                  <Textarea
                    id={`notes-${contact.id}`}
                    value={contact.notes}
                    onChange={(e) => handleContactChange(contact._id || contact.id || "", "notes", e.target.value)}
                    placeholder="Additional notes, context, or reminders about this contact"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload(contact._id || contact.id || "")}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Documents (Contracts, Agreements)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Upload contracts, agreements, or other documents
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Add Suggestions */}
      {contacts.length === 0 && (
        <Card className="p-6 border-dashed bg-muted/30">
          <h4 className="font-semibold mb-3">Recommended Contacts to Add:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium mb-1">Must-Have:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Banking Manager / Relationship Manager</li>
                <li>Accountant / CPA</li>
                <li>Attorney / Corporate Counsel</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Highly Recommended:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Bookkeeper</li>
                <li>Insurance Broker</li>
                <li>Payroll Provider Contact</li>
                <li>Financial Advisor / Fractional CFO</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}

