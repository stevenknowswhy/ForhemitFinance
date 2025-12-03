/**
 * Hook for managing Business Profile form state and handlers
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrg } from "../../../../contexts/OrgContext";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Owner, Product } from "../types";

export function useBusinessProfileForm() {
  const { toast } = useToast();
  const { currentOrgId } = useOrg();

  const businessProfile = useQuery(
    api.businessProfiles.getBusinessProfile,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  );

  const updateBusinessProfile = useMutation(api.businessProfiles.updateBusinessProfile);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Business Branding
  const [businessIcon, setBusinessIcon] = useState("");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

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
  const [owners, setOwners] = useState<Owner[]>([
    { id: "1", name: "", ownershipPercentage: "", linkedIn: "", role: "" }
  ]);
  const [registeredAgentName, setRegisteredAgentName] = useState("");
  const [registeredAgentCompany, setRegisteredAgentCompany] = useState("");
  const [registeredAgentStreet, setRegisteredAgentStreet] = useState("");
  const [registeredAgentCity, setRegisteredAgentCity] = useState("");
  const [registeredAgentState, setRegisteredAgentState] = useState("");
  const [registeredAgentZip, setRegisteredAgentZip] = useState("");
  const [registeredAgentPhone, setRegisteredAgentPhone] = useState("");
  const [registeredAgentEmail, setRegisteredAgentEmail] = useState("");

  // Derive usesRegisteredAgent from registeredAgent presence
  const usesRegisteredAgent = Boolean(
    registeredAgentName || registeredAgentCompany || registeredAgentStreet || 
    registeredAgentCity || registeredAgentState || registeredAgentZip || 
    registeredAgentPhone || registeredAgentEmail
  );

  // Operational Details
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [independentContractors, setIndependentContractors] = useState("");
  const [workModel, setWorkModel] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // Products/Services CRUD
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
        setOwners(businessProfile.owners.map((o: any, idx: number) => ({
          id: idx.toString(),
          name: o.name,
          ownershipPercentage: o.ownershipPercentage || "",
          linkedIn: o.linkedIn || "",
          role: o.role || "",
        })));
      }
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
        setProducts(businessProfile.products.map((p: any, idx: number) => ({
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
      // Load certifications from new array structure, with fallback to legacy booleans
      if (businessProfile.certifications && businessProfile.certifications.length > 0) {
        const certs = businessProfile.certifications;
        setCert8a(certs.some((c: any) => c.type === "8a") || false);
        setCertWosb(certs.some((c: any) => c.type === "wosb") || false);
        setCertMbe(certs.some((c: any) => c.type === "mbe") || false);
        setGdprCompliant(certs.some((c: any) => c.type === "gdpr") || false);
        setCcpaCompliant(certs.some((c: any) => c.type === "ccpa") || false);
        const isoCert = certs.find((c: any) => c.type === "iso");
        setIsoCertifications(isoCert?.notes || "");
      } else {
        // Legacy structure: read from boolean fields
        setCert8a(businessProfile.cert8a || false);
        setCertWosb(businessProfile.certWosb || false);
        setCertMbe(businessProfile.certMbe || false);
        setIsoCertifications(businessProfile.isoCertifications || "");
        setGdprCompliant(businessProfile.gdprCompliant || false);
        setCcpaCompliant(businessProfile.ccpaCompliant || false);
      }
    }
  }, [businessProfile]);

  // Owner handlers
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
      setOwners(owners.filter((owner) => owner.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "At least one owner is required.",
        variant: "destructive",
      });
    }
  };

  const handleOwnerChange = (id: string, field: keyof Owner, value: string) => {
    setOwners(owners.map((owner) =>
      owner.id === id ? { ...owner, [field]: value } : owner
    ));
  };

  // Product handlers
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
    setProducts(products.map((p) =>
      p.id === id ? { ...p, name: editingProductName.trim(), isEditing: false } : p
    ));
    setEditingProductId(null);
    setEditingProductName("");
  };

  const handleCancelEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product && !product.name) {
      setProducts(products.filter((p) => p.id !== id));
    } else {
      setProducts(products.map((p) =>
        p.id === id ? { ...p, isEditing: false } : p
      ));
    }
    setEditingProductId(null);
    setEditingProductName("");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast({
      title: "Product removed",
      description: "The product/service has been removed.",
    });
  };

  // Icon upload handlers
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

  const handleIconUploadBegin = () => {
    setIsUploadingIcon(true);
  };

  const handleIconChange = (url: string) => {
    setBusinessIcon(url);
  };

  // Clear registered agent
  const handleClearRegisteredAgent = () => {
    setRegisteredAgentName("");
    setRegisteredAgentCompany("");
    setRegisteredAgentStreet("");
    setRegisteredAgentCity("");
    setRegisteredAgentState("");
    setRegisteredAgentZip("");
    setRegisteredAgentPhone("");
    setRegisteredAgentEmail("");
  };

  // Save handler
  const handleSave = async () => {
    if (!currentOrgId) return;

    try {
      await updateBusinessProfile({
        orgId: currentOrgId,
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
        owners: owners.filter((o) => o.name).map((o) => ({
          name: o.name,
          ownershipPercentage: o.ownershipPercentage || undefined,
          linkedIn: o.linkedIn || undefined,
          role: o.role || undefined,
        })),
        registeredAgent: (registeredAgentName || registeredAgentCompany || registeredAgentStreet || registeredAgentCity || registeredAgentState || registeredAgentZip || registeredAgentPhone || registeredAgentEmail) ? {
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
        products: products.map((p) => p.name).filter(Boolean),
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

  return {
    // Data
    currentUser,
    currentUserId: currentUser?._id,
    businessIcon,
    isUploadingIcon,
    legalBusinessName,
    dbaTradeName,
    einTaxId,
    entityType,
    filingState,
    dateOfIncorporation,
    naicsCode,
    businessCategory,
    businessStructure,
    registeredAddress,
    headquartersAddress,
    mailingAddress,
    businessPhone,
    businessEmail,
    businessWebsite,
    dunsNumber,
    samUei,
    cageCode,
    stateBusinessLicense,
    localBusinessLicense,
    resellersPermit,
    stateTaxRegistrationId,
    primaryBankName,
    merchantProvider,
    averageMonthlyRevenue,
    fundingStatus,
    stageOfBusiness,
    owners,
    usesRegisteredAgent,
    registeredAgentName,
    registeredAgentCompany,
    registeredAgentStreet,
    registeredAgentCity,
    registeredAgentState,
    registeredAgentZip,
    registeredAgentPhone,
    registeredAgentEmail,
    numberOfEmployees,
    independentContractors,
    workModel,
    businessDescription,
    products,
    editingProductId,
    editingProductName,
    womanOwned,
    minorityOwned,
    veteranOwned,
    lgbtqOwned,
    dbeStatus,
    hubzoneQualification,
    ruralUrban,
    cert8a,
    certWosb,
    certMbe,
    isoCertifications,
    gdprCompliant,
    ccpaCompliant,
    // Setters
    setLegalBusinessName,
    setDbaTradeName,
    setEinTaxId,
    setEntityType,
    setFilingState,
    setDateOfIncorporation,
    setNaicsCode,
    setBusinessCategory,
    setBusinessStructure,
    setRegisteredAddress,
    setHeadquartersAddress,
    setMailingAddress,
    setBusinessPhone,
    setBusinessEmail,
    setBusinessWebsite,
    setDunsNumber,
    setSamUei,
    setCageCode,
    setStateBusinessLicense,
    setLocalBusinessLicense,
    setResellersPermit,
    setStateTaxRegistrationId,
    setPrimaryBankName,
    setMerchantProvider,
    setAverageMonthlyRevenue,
    setFundingStatus,
    setStageOfBusiness,
    setRegisteredAgentName,
    setRegisteredAgentCompany,
    setRegisteredAgentStreet,
    setRegisteredAgentCity,
    setRegisteredAgentState,
    setRegisteredAgentZip,
    setRegisteredAgentPhone,
    setRegisteredAgentEmail,
    setNumberOfEmployees,
    setIndependentContractors,
    setWorkModel,
    setBusinessDescription,
    setEditingProductName,
    setWomanOwned,
    setMinorityOwned,
    setVeteranOwned,
    setLgbtqOwned,
    setDbeStatus,
    setHubzoneQualification,
    setRuralUrban,
    setCert8a,
    setCertWosb,
    setCertMbe,
    setIsoCertifications,
    setGdprCompliant,
    setCcpaCompliant,
    // Handlers
    handleAddOwner,
    handleRemoveOwner,
    handleOwnerChange,
    handleAddProduct,
    handleEditProduct,
    handleSaveProduct,
    handleCancelEdit,
    handleDeleteProduct,
    handleIconUploadComplete,
    handleIconUploadError,
    handleIconUploadBegin,
    handleIconChange,
    handleClearRegisteredAgent,
    handleSave,
  };
}

