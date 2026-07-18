import { apiFetch } from "../services/api";

export type GlobalConfig = {
    sliderImages: {
        imageUrl: string;
        id: string;
        title?: string;
    }[];
    isPaymentEnabled: boolean;
    maintenanceMode: boolean;
    isReferralEnabled: boolean;
    adminMobile: string;
    adminEmail: string;
    packagingPercent: number;
    gstPercent: number;
    tnMinOrderValue: number;
    otherStateMinOrderValue: number;
    adminWhatsapp: string;
    additionalContact: string;
    adminAddress: string;
    location: string;
    disableGstForTN: boolean;
    packageTags: string[];
    aiTags: string[];
    isEstimateEmailEnabled: boolean;
    isForgotOTPEnabled: boolean;
    IsOrderConfirmSMSEnabled: boolean;
    isOrderDispatchSMSEnabled: boolean;
    isOrderPlaceSMSEnabled: boolean;
    isPaidSMSEnabled: boolean;
    isRegisterOTPEnabled: boolean;
    isCartUpdateSMSEnabled: boolean;
    gmapLink: string;
    displayMobile: string;
};

export async function fetchGlobalConfig(): Promise<GlobalConfig> {
    return apiFetch("/config");
}