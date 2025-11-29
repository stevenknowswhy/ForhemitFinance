"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building2, FileText, Users, MapPin, Award, TrendingUp, Plus, Trash2, Edit2, Check, X, Upload, Image as ImageIcon } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { UploadButton } from "@/lib/uploadthing";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function BusinessProfileSettings() {
  const { toast } = useToast();
  const businessProfile = useQuery(api.businessProfiles.getBusinessProfile);
  const updateBusinessProfile = useMutation(api.businessProfiles.updateBusinessProfile);

  // Business Branding
  const [businessIcon, setBusinessIcon] = useState("");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Core Business Identity
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [dbaTradeName, setDbaTradeName] = useState("");
  const [einTaxId, setEinTaxId] = useState("");
  const [entityType, setEntityType] = useState("");
  const [filingState, setFilingState] = useState("");
  const [dateOfIncorporation, setDateOfIncorporation] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessStructure, setBusinessStructure] = useState("");

  // Business Address & Contact
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [headquartersAddress, setHeadquartersAddress] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");

  // Compliance & Verification IDs
  const [dunsNumber, setDunsNumber] = useState("");
  const [samUei, setSamUei] = useState("");
  const [cageCode, setCageCode] = useState("");
  const [stateBusinessLicense, setStateBusinessLicense] = useState("");
  const [localBusinessLicense, setLocalBusinessLicense] = useState("");
  const [resellersPermit, setResellersPermit] = useState("");
  const [stateTaxRegistrationId, setStateTaxRegistrationId] = useState("");

  // Financial Profile
  const [primaryBankName, setPrimaryBankName] = useState("");
  const [merchantProvider, setMerchantProvider] = useState("");
  const [averageMonthlyRevenue, setAverageMonthlyRevenue] = useState("");
  const [fundingStatus, setFundingStatus] = useState("");
  const [stageOfBusiness, setStageOfBusiness] = useState("");

  // Ownership & Leadership
  interface Owner {
    id: string;
    name: string;
    ownershipPercentage: string;
    linkedIn: string;
    role?: string;
  }
  const [owners, setOwners] = useState<Owner[]>([
    { id: "1", name: "", ownershipPercentage: "", linkedIn: "", role: "" }
  ]);
  const [usesRegisteredAgent, setUsesRegisteredAgent] = useState(false);
  const [registeredAgentName, setRegisteredAgentName] = useState("");
  const [registeredAgentCompany, setRegisteredAgentCompany] = useState("");
  const [registeredAgentAddress, setRegisteredAgentAddress] = useState("");
  const [registeredAgentStreet, setRegisteredAgentStreet] = useState("");
  const [registeredAgentCity, setRegisteredAgentCity] = useState("");
  const [registeredAgentState, setRegisteredAgentState] = useState("");
  const [registeredAgentZip, setRegisteredAgentZip] = useState("");
  const [registeredAgentPhone, setRegisteredAgentPhone] = useState("");
  const [registeredAgentEmail, setRegisteredAgentEmail] = useState("");

  // Operational Details
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [independentContractors, setIndependentContractors] = useState("");
  const [workModel, setWorkModel] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  
  // Products/Services CRUD
  interface Product {
    id: string;
    name: string;
    isEditing?: boolean;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState("");

  // Business Demographics
  const [womanOwned, setWomanOwned] = useState(false);
  const [minorityOwned, setMinorityOwned] = useState(false);
  const [veteranOwned, setVeteranOwned] = useState(false);
  const [lgbtqOwned, setLgbtqOwned] = useState(false);
  const [dbeStatus, setDbeStatus] = useState(false);
  const [hubzoneQualification, setHubzoneQualification] = useState(false);
  const [ruralUrban, setRuralUrban] = useState("");

  // Certifications
  const [cert8a, setCert8a] = useState(false);
  const [certWosb, setCertWosb] = useState(false);
  const [certMbe, setCertMbe] = useState(false);
  const [isoCertifications, setIsoCertifications] = useState("");
  const [gdprCompliant, setGdprCompliant] = useState(false);
  const [ccpaCompliant, setCcpaCompliant] = useState(false);

  const handleAddOwner = () => {
    setOwners([...owners, { 
      id: Date.now().toString(), 
      name: "", 
      ownershipPercentage: "", 
      linkedIn: "",
      role: ""
    }]);
  };

  const handleRemoveOwner = (id: string) => {
    if (owners.length > 1) {
      setOwners(owners.filter(owner => owner.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "At least one owner is required.",
        variant: "destructive",
      });
    }
  };

  // Products/Services CRUD handlers
  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "",
      isEditing: true,
    };
    setProducts([...products, newProduct]);
    setEditingProductId(newProduct.id);
    setEditingProductName("");
  };

  const handleEditProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setEditingProductId(id);
      setEditingProductName(product.name);
    }
  };

  const handleSaveProduct = (id: string) => {
    if (!editingProductName.trim()) {
      toast({
        title: "Validation error",
        description: "Product name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setProducts(products.map(p => 
      p.id === id ? { ...p, name: editingProductName.trim(), isEditing: false } : p
    ));
    setEditingProductId(null);
    setEditingProductName("");
  };

  const handleCancelEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product && !product.name) {
      // If it was a new product with no name, remove it
      setProducts(products.filter(p => p.id !== id));
    } else {
      setProducts(products.map(p => 
        p.id === id ? { ...p, isEditing: false } : p
      ));
    }
    setEditingProductId(null);
    setEditingProductName("");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Product removed",
      description: "The product/service has been removed.",
    });
  };

  const handleOwnerChange = (id: string, field: keyof Owner, value: string) => {
    setOwners(owners.map(owner => 
      owner.id === id ? { ...owner, [field]: value } : owner
    ));
  };

  // Load data from backend
  useEffect(() => {
    if (businessProfile) {
      setBusinessIcon(businessProfile.businessIcon || "");
      setLegalBusinessName(businessProfile.legalBusinessName || "");
      setDbaTradeName(businessProfile.dbaTradeName || "");
      setEinTaxId(businessProfile.einTaxId || "");
      setEntityType(businessProfile.entityType || "");
      setFilingState(businessProfile.filingState || "");
      setDateOfIncorporation(businessProfile.dateOfIncorporation || "");
      setNaicsCode(businessProfile.naicsCode || "");
      setBusinessCategory(businessProfile.businessCategory || "");
      setBusinessStructure(businessProfile.businessStructure || "");
      setRegisteredAddress(businessProfile.registeredAddress || "");
      setHeadquartersAddress(businessProfile.headquartersAddress || "");
      setMailingAddress(businessProfile.mailingAddress || "");
      setBusinessPhone(businessProfile.businessPhone || "");
      setBusinessEmail(businessProfile.businessEmail || "");
      setBusinessWebsite(businessProfile.businessWebsite || "");
      setDunsNumber(businessProfile.dunsNumber || "");
      setSamUei(businessProfile.samUei || "");
      setCageCode(businessProfile.cageCode || "");
      setStateBusinessLicense(businessProfile.stateBusinessLicense || "");
      setLocalBusinessLicense(businessProfile.localBusinessLicense || "");
      setResellersPermit(businessProfile.resellersPermit || "");
      setStateTaxRegistrationId(businessProfile.stateTaxRegistrationId || "");
      setPrimaryBankName(businessProfile.primaryBankName || "");
      setMerchantProvider(businessProfile.merchantProvider || "");
      setAverageMonthlyRevenue(businessProfile.averageMonthlyRevenue?.toString() || "");
      setFundingStatus(businessProfile.fundingStatus || "");
      setStageOfBusiness(businessProfile.stageOfBusiness || "");
      if (businessProfile.owners && businessProfile.owners.length > 0) {
        setOwners(businessProfile.owners.map((o, idx) => ({
          id: idx.toString(),
          name: o.name,
          ownershipPercentage: o.ownershipPercentage || "",
          linkedIn: o.linkedIn || "",
          role: o.role || "",
        })));
      }
      setUsesRegisteredAgent(businessProfile.usesRegisteredAgent || false);
      if (businessProfile.registeredAgent) {
        setRegisteredAgentName(businessProfile.registeredAgent.name || "");
        setRegisteredAgentCompany(businessProfile.registeredAgent.company || "");
        setRegisteredAgentStreet(businessProfile.registeredAgent.street || "");
        setRegisteredAgentCity(businessProfile.registeredAgent.city || "");
        setRegisteredAgentState(businessProfile.registeredAgent.state || "");
        setRegisteredAgentZip(businessProfile.registeredAgent.zip || "");
        setRegisteredAgentPhone(businessProfile.registeredAgent.phone || "");
        setRegisteredAgentEmail(businessProfile.registeredAgent.email || "");
      }
      setNumberOfEmployees(businessProfile.numberOfEmployees?.toString() || "");
      setIndependentContractors(businessProfile.independentContractors?.toString() || "");
      setWorkModel(businessProfile.workModel || "");
      setBusinessDescription(businessProfile.businessDescription || "");
      if (businessProfile.products) {
        setProducts(businessProfile.products.map((p, idx) => ({
          id: idx.toString(),
          name: p,
        })));
      }
      setWomanOwned(businessProfile.womanOwned || false);
      setMinorityOwned(businessProfile.minorityOwned || false);
      setVeteranOwned(businessProfile.veteranOwned || false);
      setLgbtqOwned(businessProfile.lgbtqOwned || false);
      setDbeStatus(businessProfile.dbeStatus || false);
      setHubzoneQualification(businessProfile.hubzoneQualification || false);
      setRuralUrban(businessProfile.ruralUrban || "");
      setCert8a(businessProfile.cert8a || false);
      setCertWosb(businessProfile.certWosb || false);
      setCertMbe(businessProfile.certMbe || false);
      setIsoCertifications(businessProfile.isoCertifications || "");
      setGdprCompliant(businessProfile.gdprCompliant || false);
      setCcpaCompliant(businessProfile.ccpaCompliant || false);
    }
  }, [businessProfile]);

  const handleIconUploadComplete = async (res: Array<{
    url: string;
    name: string;
    serverData?: {
      fileUrl: string;
      fileKey: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
    };
  }>) => {
    if (res && res.length > 0) {
      const file = res[0];
      const fileUrl = (file as any).ufsUrl || file.url || (file as any).serverData?.fileUrl;
      if (fileUrl) {
        setBusinessIcon(fileUrl);
        setIsUploadingIcon(false);
        toast({
          title: "Icon uploaded",
          description: "Your business icon has been uploaded successfully.",
        });
      }
    }
  };

  const handleIconUploadError = (error: Error) => {
    console.error("Icon upload error:", error);
    setIsUploadingIcon(false);
    toast({
      title: "Upload failed",
      description: error.message || "Failed to upload business icon. Please try again.",
      variant: "destructive",
    });
  };

  const handleSave = async () => {
    try {
      await updateBusinessProfile({
        businessIcon: businessIcon || undefined,
        legalBusinessName: legalBusinessName || undefined,
        dbaTradeName: dbaTradeName || undefined,
        einTaxId: einTaxId || undefined,
        entityType: entityType || undefined,
        filingState: filingState || undefined,
        dateOfIncorporation: dateOfIncorporation || undefined,
        naicsCode: naicsCode || undefined,
        businessCategory: businessCategory || undefined,
        businessStructure: businessStructure || undefined,
        registeredAddress: registeredAddress || undefined,
        headquartersAddress: headquartersAddress || undefined,
        mailingAddress: mailingAddress || undefined,
        businessPhone: businessPhone || undefined,
        businessEmail: businessEmail || undefined,
        businessWebsite: businessWebsite || undefined,
        dunsNumber: dunsNumber || undefined,
        samUei: samUei || undefined,
        cageCode: cageCode || undefined,
        stateBusinessLicense: stateBusinessLicense || undefined,
        localBusinessLicense: localBusinessLicense || undefined,
        resellersPermit: resellersPermit || undefined,
        stateTaxRegistrationId: stateTaxRegistrationId || undefined,
        primaryBankName: primaryBankName || undefined,
        merchantProvider: merchantProvider || undefined,
        averageMonthlyRevenue: averageMonthlyRevenue ? parseFloat(averageMonthlyRevenue) : undefined,
        fundingStatus: fundingStatus || undefined,
        stageOfBusiness: stageOfBusiness || undefined,
        owners: owners.filter(o => o.name).map(o => ({
          name: o.name,
          ownershipPercentage: o.ownershipPercentage || undefined,
          linkedIn: o.linkedIn || undefined,
          role: o.role || undefined,
        })),
        usesRegisteredAgent: usesRegisteredAgent || undefined,
        registeredAgent: usesRegisteredAgent ? {
          name: registeredAgentName || undefined,
          company: registeredAgentCompany || undefined,
          street: registeredAgentStreet || undefined,
          city: registeredAgentCity || undefined,
          state: registeredAgentState || undefined,
          zip: registeredAgentZip || undefined,
          phone: registeredAgentPhone || undefined,
          email: registeredAgentEmail || undefined,
        } : undefined,
        numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : undefined,
        independentContractors: independentContractors ? parseInt(independentContractors) : undefined,
        workModel: workModel as "remote" | "hybrid" | "on_site" | undefined,
        businessDescription: businessDescription || undefined,
        products: products.map(p => p.name).filter(Boolean),
        womanOwned: womanOwned || undefined,
        minorityOwned: minorityOwned || undefined,
        veteranOwned: veteranOwned || undefined,
        lgbtqOwned: lgbtqOwned || undefined,
        dbeStatus: dbeStatus || undefined,
        hubzoneQualification: hubzoneQualification || undefined,
        ruralUrban: ruralUrban as "rural" | "urban" | "suburban" | undefined,
        cert8a: cert8a || undefined,
        certWosb: certWosb || undefined,
        certMbe: certMbe || undefined,
        isoCertifications: isoCertifications || undefined,
        gdprCompliant: gdprCompliant || undefined,
        ccpaCompliant: ccpaCompliant || undefined,
      });

      toast({
        title: "Business profile saved",
        description: "Your business profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save business profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Core Business Identity */}
      <Accordion type="multiple" className="w-full space-y-2">
        <AccordionItem value="core-identity" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">Core Business Identity</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Business Icon Upload */}
            <div className="space-y-2 md:col-span-2">
              <Label>Business Icon / Logo</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your business or website icon. This will be used for branding on reports and documents.
              </p>
              <div className="flex items-center gap-4">
                {businessIcon && (
                  <div className="relative">
                    <img
                      src={businessIcon}
                      alt="Business icon"
                      className="w-24 h-24 object-contain border border-border rounded-lg bg-muted p-2"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <UploadButton
                    endpoint="businessIconUploader"
                    input={{
                      userId: currentUser?._id || "",
                    }}
                    onClientUploadComplete={handleIconUploadComplete}
                    onUploadError={handleIconUploadError}
                    onUploadBegin={() => setIsUploadingIcon(true)}
                    className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
                  />
                  {isUploadingIcon && (
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                  )}
                  {businessIcon && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBusinessIcon("");
                        toast({
                          title: "Icon removed",
                          description: "The icon will be removed when you save.",
                        });
                      }}
                      className="mt-2"
                    >
                      Remove Icon
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalName">
                  Legal Business Name <span className="text-primary">⭐</span>
                </Label>
                <Input
                  id="legalName"
                  value={legalBusinessName}
                  onChange={(e) => setLegalBusinessName(e.target.value)}
                  placeholder="Enter legal business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dba">
                  DBA / Trade Name <span className="text-primary">⭐</span>
                </Label>
                <Input
                  id="dba"
                  value={dbaTradeName}
                  onChange={(e) => setDbaTradeName(e.target.value)}
                  placeholder="Doing business as"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ein">
                  EIN / Tax ID Number <span className="text-primary">⭐</span>
                </Label>
                <Input
                  id="ein"
                  value={einTaxId}
                  onChange={(e) => setEinTaxId(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityType">Business Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="s_corp">S-Corporation</SelectItem>
                    <SelectItem value="c_corp">C-Corporation</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filingState">Corporation Filing State / Jurisdiction</Label>
                <Input
                  id="filingState"
                  value={filingState}
                  onChange={(e) => setFilingState(e.target.value)}
                  placeholder="e.g., Delaware"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incorporationDate">Date of Incorporation</Label>
                <Input
                  id="incorporationDate"
                  type="date"
                  value={dateOfIncorporation}
                  onChange={(e) => setDateOfIncorporation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="naics">NAICS Code</Label>
                <Input
                  id="naics"
                  value={naicsCode}
                  onChange={(e) => setNaicsCode(e.target.value)}
                  placeholder="Enter NAICS code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Business Category</Label>
                <Input
                  id="category"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="e.g., Technology, Retail, Services"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="structure">
                  Business Structure Details <span className="text-primary">⭐</span>
                </Label>
                <Select value={businessStructure} onValueChange={setBusinessStructure}>
                  <SelectTrigger id="structure">
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_member_llc">Single-Member LLC</SelectItem>
                    <SelectItem value="multi_member_llc">Multi-Member LLC</SelectItem>
                    <SelectItem value="c_corp_class_a">C-Corp Class A</SelectItem>
                    <SelectItem value="c_corp_class_b">C-Corp Class B</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Business Address & Contact */}
        <AccordionItem value="address-contact" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">Business Address & Contact Info</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="registeredAddress">Registered Business Address</Label>
                <Textarea
                  id="registeredAddress"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="Street address, City, State, ZIP"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="headquartersAddress">Headquarters Address (if different)</Label>
                <Textarea
                  id="headquartersAddress"
                  value={headquartersAddress}
                  onChange={(e) => setHeadquartersAddress(e.target.value)}
                  placeholder="Street address, City, State, ZIP"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mailingAddress">Mailing Address (if different)</Label>
                <Textarea
                  id="mailingAddress"
                  value={mailingAddress}
                  onChange={(e) => setMailingAddress(e.target.value)}
                  placeholder="Street address, City, State, ZIP"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="businessWebsite">Business Website</Label>
                <Input
                  id="businessWebsite"
                  type="url"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Compliance & Verification IDs */}
        <AccordionItem value="compliance" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-semibold">Compliance & Verification IDs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duns">
                  DUNS Number <span className="text-primary">⭐</span>
                </Label>
                <Input
                  id="duns"
                  value={dunsNumber}
                  onChange={(e) => setDunsNumber(e.target.value)}
                  placeholder="9-digit DUNS number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sam">
                  SAM.gov UEI <span className="text-primary">⭐</span>
                </Label>
                <Input
                  id="sam"
                  value={samUei}
                  onChange={(e) => setSamUei(e.target.value)}
                  placeholder="Unique Entity Identifier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cage">CAGE Code</Label>
                <Input
                  id="cage"
                  value={cageCode}
                  onChange={(e) => setCageCode(e.target.value)}
                  placeholder="5-character CAGE code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateLicense">State Business License Number</Label>
                <Input
                  id="stateLicense"
                  value={stateBusinessLicense}
                  onChange={(e) => setStateBusinessLicense(e.target.value)}
                  placeholder="State license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localLicense">Local Business License / Permit Numbers</Label>
                <Input
                  id="localLicense"
                  value={localBusinessLicense}
                  onChange={(e) => setLocalBusinessLicense(e.target.value)}
                  placeholder="Local license numbers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resellersPermit">Reseller's Permit / Seller's Permit</Label>
                <Input
                  id="resellersPermit"
                  value={resellersPermit}
                  onChange={(e) => setResellersPermit(e.target.value)}
                  placeholder="Reseller permit number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateTaxId">State Tax Registration ID</Label>
                <Input
                  id="stateTaxId"
                  value={stateTaxRegistrationId}
                  onChange={(e) => setStateTaxRegistrationId(e.target.value)}
                  placeholder="State tax registration ID"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Financial Profile */}
        <AccordionItem value="financial" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Financial Profile</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryBank">Primary Bank Name</Label>
                <Input
                  id="primaryBank"
                  value={primaryBankName}
                  onChange={(e) => setPrimaryBankName(e.target.value)}
                  placeholder="Bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantProvider">Merchant Processing Provider</Label>
                <Select value={merchantProvider} onValueChange={setMerchantProvider}>
                  <SelectTrigger id="merchantProvider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRevenue">Average Monthly Revenue (optional)</Label>
                <Input
                  id="monthlyRevenue"
                  type="number"
                  value={averageMonthlyRevenue}
                  onChange={(e) => setAverageMonthlyRevenue(e.target.value)}
                  placeholder="$0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingStatus">Funding Status</Label>
                <Select value={fundingStatus} onValueChange={setFundingStatus}>
                  <SelectTrigger id="fundingStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                    <SelectItem value="angel">Angel</SelectItem>
                    <SelectItem value="vc_backed">VC-Backed</SelectItem>
                    <SelectItem value="friends_family">Friends & Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stage">Stage of Business</Label>
                <Select value={stageOfBusiness} onValueChange={setStageOfBusiness}>
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_revenue">Pre-Revenue</SelectItem>
                    <SelectItem value="early_revenue">Early Revenue</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Ownership & Leadership */}
        <AccordionItem value="ownership" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Ownership & Leadership Info</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Owners List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Owners <span className="text-primary">⭐</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOwner}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Owner
                </Button>
              </div>

              {owners.map((owner, index) => (
                <Card key={owner.id} className="p-4 border-2">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Owner {index + 1} {index === 0 && "(Primary)"}
                    </h4>
                    {owners.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOwner(owner.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`owner-name-${owner.id}`}>
                        Owner Name {index === 0 && <span className="text-primary">⭐</span>}
                      </Label>
                      <Input
                        id={`owner-name-${owner.id}`}
                        value={owner.name}
                        onChange={(e) => handleOwnerChange(owner.id, "name", e.target.value)}
                        placeholder="Owner full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`owner-percent-${owner.id}`}>Ownership Percentage</Label>
                      <Input
                        id={`owner-percent-${owner.id}`}
                        type="number"
                        value={owner.ownershipPercentage}
                        onChange={(e) => handleOwnerChange(owner.id, "ownershipPercentage", e.target.value)}
                        placeholder="%"
                        max={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`owner-linkedin-${owner.id}`}>LinkedIn Profile</Label>
                      <Input
                        id={`owner-linkedin-${owner.id}`}
                        type="url"
                        value={owner.linkedIn}
                        onChange={(e) => handleOwnerChange(owner.id, "linkedIn", e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`owner-role-${owner.id}`}>Role (Optional)</Label>
                      <Input
                        id={`owner-role-${owner.id}`}
                        value={owner.role || ""}
                        onChange={(e) => handleOwnerChange(owner.id, "role", e.target.value)}
                        placeholder="e.g., CEO, CFO, COO"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Registered Agent - Conditional Reveal */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usesRegisteredAgent"
                  checked={usesRegisteredAgent}
                  onChange={(e) => setUsesRegisteredAgent(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="usesRegisteredAgent" className="text-base font-semibold cursor-pointer">
                  My business uses a Registered Agent
                </Label>
              </div>

              <Collapsible open={usesRegisteredAgent}>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentName">Registered Agent Name</Label>
                      <Input
                        id="registeredAgentName"
                        value={registeredAgentName}
                        onChange={(e) => setRegisteredAgentName(e.target.value)}
                        placeholder="Agent name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentCompany">Registered Agent Company (Optional)</Label>
                      <Input
                        id="registeredAgentCompany"
                        value={registeredAgentCompany}
                        onChange={(e) => setRegisteredAgentCompany(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="registeredAgentStreet">Street Address</Label>
                      <Input
                        id="registeredAgentStreet"
                        value={registeredAgentStreet}
                        onChange={(e) => setRegisteredAgentStreet(e.target.value)}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentCity">City</Label>
                      <Input
                        id="registeredAgentCity"
                        value={registeredAgentCity}
                        onChange={(e) => setRegisteredAgentCity(e.target.value)}
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentState">State</Label>
                      <Input
                        id="registeredAgentState"
                        value={registeredAgentState}
                        onChange={(e) => setRegisteredAgentState(e.target.value)}
                        placeholder="State"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentZip">ZIP Code</Label>
                      <Input
                        id="registeredAgentZip"
                        value={registeredAgentZip}
                        onChange={(e) => setRegisteredAgentZip(e.target.value)}
                        placeholder="ZIP"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentPhone">Phone</Label>
                      <Input
                        id="registeredAgentPhone"
                        type="tel"
                        value={registeredAgentPhone}
                        onChange={(e) => setRegisteredAgentPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAgentEmail">Email</Label>
                      <Input
                        id="registeredAgentEmail"
                        type="email"
                        value={registeredAgentEmail}
                        onChange={(e) => setRegisteredAgentEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Operational Details */}
        <AccordionItem value="operational" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">Operational Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employees">Number of Employees</Label>
                <Input
                  id="employees"
                  type="number"
                  value={numberOfEmployees}
                  onChange={(e) => setNumberOfEmployees(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractors">Independent Contractors</Label>
                <Input
                  id="contractors"
                  type="number"
                  value={independentContractors}
                  onChange={(e) => setIndependentContractors(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="workModel">Work Model</Label>
                <Select value={workModel} onValueChange={setWorkModel}>
                  <SelectTrigger id="workModel">
                    <SelectValue placeholder="Select work model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on_site">On-Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="products">Primary Products/Services</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAddProduct}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No products/services added yet. Click the + icon to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        {editingProductId === product.id ? (
                          <>
                            <Input
                              value={editingProductName}
                              onChange={(e) => setEditingProductName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveProduct(product.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit(product.id);
                                }
                              }}
                              className="flex-1 h-8"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveProduct(product.id)}
                              className="h-7 w-7 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelEdit(product.id)}
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{product.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product.id)}
                              className="h-7 w-7"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Business Demographics */}
        <AccordionItem value="demographics" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Business Demographics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="womanOwned">Woman-Owned?</Label>
                <Switch
                  id="womanOwned"
                  checked={womanOwned}
                  onCheckedChange={setWomanOwned}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="minorityOwned">Minority-Owned?</Label>
                <Switch
                  id="minorityOwned"
                  checked={minorityOwned}
                  onCheckedChange={setMinorityOwned}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="veteranOwned">Veteran-Owned?</Label>
                <Switch
                  id="veteranOwned"
                  checked={veteranOwned}
                  onCheckedChange={setVeteranOwned}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="lgbtqOwned">LGBTQ-Owned?</Label>
                <Switch
                  id="lgbtqOwned"
                  checked={lgbtqOwned}
                  onCheckedChange={setLgbtqOwned}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="dbe">Disadvantaged Business Enterprise (DBE)</Label>
                <Switch
                  id="dbe"
                  checked={dbeStatus}
                  onCheckedChange={setDbeStatus}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="hubzone">HUBZone Qualification</Label>
                <Switch
                  id="hubzone"
                  checked={hubzoneQualification}
                  onCheckedChange={setHubzoneQualification}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ruralUrban">Rural vs Urban Classification</Label>
                <Select value={ruralUrban} onValueChange={setRuralUrban}>
                  <SelectTrigger id="ruralUrban">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="suburban">Suburban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Certifications */}
        <AccordionItem value="certifications" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
          <AccordionTrigger className="hover:no-underline hover:text-primary">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-semibold">Certification Tracking</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="cert8a">8(a) Certification</Label>
                <Switch
                  id="cert8a"
                  checked={cert8a}
                  onCheckedChange={setCert8a}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="certWosb">WOSB / EDWOSB</Label>
                <Switch
                  id="certWosb"
                  checked={certWosb}
                  onCheckedChange={setCertWosb}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="certMbe">MBE / WBE / DBE</Label>
                <Switch
                  id="certMbe"
                  checked={certMbe}
                  onCheckedChange={setCertMbe}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iso">ISO Certifications</Label>
                <Input
                  id="iso"
                  value={isoCertifications}
                  onChange={(e) => setIsoCertifications(e.target.value)}
                  placeholder="e.g., ISO 9001, ISO 27001"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="gdpr">GDPR Compliant</Label>
                <Switch
                  id="gdpr"
                  checked={gdprCompliant}
                  onCheckedChange={setGdprCompliant}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="ccpa">CCPA Compliant</Label>
                <Switch
                  id="ccpa"
                  checked={ccpaCompliant}
                  onCheckedChange={setCcpaCompliant}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={handleSave} className="w-full mt-6">
        Save Business Profile
      </Button>
    </div>
  );
}

