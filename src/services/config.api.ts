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
};

export async function fetchGlobalConfig(): Promise<GlobalConfig> {
    return apiFetch("/config");
}