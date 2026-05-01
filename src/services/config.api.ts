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
    northEastMinOrderValue: number;
    adminWhatsapp: string;
    additionalContact: string;
    adminAddress: string;
};

export async function fetchGlobalConfig(): Promise<GlobalConfig> {
    return apiFetch("/config");
}