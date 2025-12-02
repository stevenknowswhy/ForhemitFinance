"use client";

import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { useBusinessProfileForm } from "./BusinessProfileSettings/hooks/useBusinessProfileForm";
import { BusinessLogoSection } from "./BusinessProfileSettings/components/BusinessLogoSection";
import { CoreBusinessIdentitySection } from "./BusinessProfileSettings/components/CoreBusinessIdentitySection";
import { AddressContactSection } from "./BusinessProfileSettings/components/AddressContactSection";
import { ComplianceSection } from "./BusinessProfileSettings/components/ComplianceSection";
import { FinancialProfileSection } from "./BusinessProfileSettings/components/FinancialProfileSection";
import { OwnershipSection } from "./BusinessProfileSettings/components/OwnershipSection";
import { OperationalDetailsSection } from "./BusinessProfileSettings/components/OperationalDetailsSection";
import { DemographicsSection } from "./BusinessProfileSettings/components/DemographicsSection";
import { CertificationsSection } from "./BusinessProfileSettings/components/CertificationsSection";
import { useToast } from "@/components/ui/hooks/use-toast";

export function BusinessProfileSettings() {
  const { toast } = useToast();
  const form = useBusinessProfileForm();

  return (
    <div className="space-y-4 py-4">
      <BusinessLogoSection
        businessIcon={form.businessIcon}
        isUploadingIcon={form.isUploadingIcon}
        currentUserId={form.currentUserId}
        onIconChange={form.handleIconChange}
        onUploadBegin={form.handleIconUploadBegin}
        onUploadError={form.handleIconUploadError}
        onUploadComplete={form.handleIconUploadComplete}
      />

      <Accordion type="multiple" className="w-full space-y-2">
        <CoreBusinessIdentitySection
          legalBusinessName={form.legalBusinessName}
          dbaTradeName={form.dbaTradeName}
          einTaxId={form.einTaxId}
          entityType={form.entityType}
          filingState={form.filingState}
          dateOfIncorporation={form.dateOfIncorporation}
          naicsCode={form.naicsCode}
          businessCategory={form.businessCategory}
          businessStructure={form.businessStructure}
          onLegalBusinessNameChange={form.setLegalBusinessName}
          onDbaTradeNameChange={form.setDbaTradeName}
          onEinTaxIdChange={form.setEinTaxId}
          onEntityTypeChange={form.setEntityType}
          onFilingStateChange={form.setFilingState}
          onDateOfIncorporationChange={form.setDateOfIncorporation}
          onNaicsCodeChange={form.setNaicsCode}
          onBusinessCategoryChange={form.setBusinessCategory}
          onBusinessStructureChange={form.setBusinessStructure}
        />

        <AddressContactSection
          registeredAddress={form.registeredAddress}
          headquartersAddress={form.headquartersAddress}
          mailingAddress={form.mailingAddress}
          businessPhone={form.businessPhone}
          businessEmail={form.businessEmail}
          businessWebsite={form.businessWebsite}
          onRegisteredAddressChange={form.setRegisteredAddress}
          onHeadquartersAddressChange={form.setHeadquartersAddress}
          onMailingAddressChange={form.setMailingAddress}
          onBusinessPhoneChange={form.setBusinessPhone}
          onBusinessEmailChange={form.setBusinessEmail}
          onBusinessWebsiteChange={form.setBusinessWebsite}
        />

        <ComplianceSection
          dunsNumber={form.dunsNumber}
          samUei={form.samUei}
          cageCode={form.cageCode}
          stateBusinessLicense={form.stateBusinessLicense}
          localBusinessLicense={form.localBusinessLicense}
          resellersPermit={form.resellersPermit}
          stateTaxRegistrationId={form.stateTaxRegistrationId}
          onDunsNumberChange={form.setDunsNumber}
          onSamUeiChange={form.setSamUei}
          onCageCodeChange={form.setCageCode}
          onStateBusinessLicenseChange={form.setStateBusinessLicense}
          onLocalBusinessLicenseChange={form.setLocalBusinessLicense}
          onResellersPermitChange={form.setResellersPermit}
          onStateTaxRegistrationIdChange={form.setStateTaxRegistrationId}
        />

        <FinancialProfileSection
          primaryBankName={form.primaryBankName}
          merchantProvider={form.merchantProvider}
          averageMonthlyRevenue={form.averageMonthlyRevenue}
          fundingStatus={form.fundingStatus}
          stageOfBusiness={form.stageOfBusiness}
          onPrimaryBankNameChange={form.setPrimaryBankName}
          onMerchantProviderChange={form.setMerchantProvider}
          onAverageMonthlyRevenueChange={form.setAverageMonthlyRevenue}
          onFundingStatusChange={form.setFundingStatus}
          onStageOfBusinessChange={form.setStageOfBusiness}
        />

        <OwnershipSection
          owners={form.owners}
          usesRegisteredAgent={form.usesRegisteredAgent}
          registeredAgentName={form.registeredAgentName}
          registeredAgentCompany={form.registeredAgentCompany}
          registeredAgentStreet={form.registeredAgentStreet}
          registeredAgentCity={form.registeredAgentCity}
          registeredAgentState={form.registeredAgentState}
          registeredAgentZip={form.registeredAgentZip}
          registeredAgentPhone={form.registeredAgentPhone}
          registeredAgentEmail={form.registeredAgentEmail}
          onAddOwner={form.handleAddOwner}
          onRemoveOwner={form.handleRemoveOwner}
          onOwnerChange={form.handleOwnerChange}
          onUsesRegisteredAgentChange={() => {}} // Not used, derived from fields
          onRegisteredAgentNameChange={form.setRegisteredAgentName}
          onRegisteredAgentCompanyChange={form.setRegisteredAgentCompany}
          onRegisteredAgentStreetChange={form.setRegisteredAgentStreet}
          onRegisteredAgentCityChange={form.setRegisteredAgentCity}
          onRegisteredAgentStateChange={form.setRegisteredAgentState}
          onRegisteredAgentZipChange={form.setRegisteredAgentZip}
          onRegisteredAgentPhoneChange={form.setRegisteredAgentPhone}
          onRegisteredAgentEmailChange={form.setRegisteredAgentEmail}
          onClearRegisteredAgent={form.handleClearRegisteredAgent}
        />

        <OperationalDetailsSection
          numberOfEmployees={form.numberOfEmployees}
          independentContractors={form.independentContractors}
          workModel={form.workModel}
          businessDescription={form.businessDescription}
          products={form.products}
          editingProductId={form.editingProductId}
          editingProductName={form.editingProductName}
          onNumberOfEmployeesChange={form.setNumberOfEmployees}
          onIndependentContractorsChange={form.setIndependentContractors}
          onWorkModelChange={form.setWorkModel}
          onBusinessDescriptionChange={form.setBusinessDescription}
          onAddProduct={form.handleAddProduct}
          onEditProduct={form.handleEditProduct}
          onSaveProduct={form.handleSaveProduct}
          onCancelEdit={form.handleCancelEdit}
          onDeleteProduct={form.handleDeleteProduct}
          onEditingProductNameChange={form.setEditingProductName}
        />

        <DemographicsSection
          womanOwned={form.womanOwned}
          minorityOwned={form.minorityOwned}
          veteranOwned={form.veteranOwned}
          lgbtqOwned={form.lgbtqOwned}
          dbeStatus={form.dbeStatus}
          hubzoneQualification={form.hubzoneQualification}
          ruralUrban={form.ruralUrban}
          onWomanOwnedChange={form.setWomanOwned}
          onMinorityOwnedChange={form.setMinorityOwned}
          onVeteranOwnedChange={form.setVeteranOwned}
          onLgbtqOwnedChange={form.setLgbtqOwned}
          onDbeStatusChange={form.setDbeStatus}
          onHubzoneQualificationChange={form.setHubzoneQualification}
          onRuralUrbanChange={form.setRuralUrban}
        />

        <CertificationsSection
          cert8a={form.cert8a}
          certWosb={form.certWosb}
          certMbe={form.certMbe}
          isoCertifications={form.isoCertifications}
          gdprCompliant={form.gdprCompliant}
          ccpaCompliant={form.ccpaCompliant}
          onCert8aChange={form.setCert8a}
          onCertWosbChange={form.setCertWosb}
          onCertMbeChange={form.setCertMbe}
          onIsoCertificationsChange={form.setIsoCertifications}
          onGdprCompliantChange={form.setGdprCompliant}
          onCcpaCompliantChange={form.setCcpaCompliant}
        />
      </Accordion>

      <Button onClick={form.handleSave} className="w-full mt-6">
        Save Business Profile
      </Button>
    </div>
  );
}
