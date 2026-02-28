import { apiFetch } from "./api";
export const updateAdminConfig = async (data: any) => {
    return apiFetch("/admin/config", {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const getSliderImagePresign = async (payload: {
    fileName: string;
    contentType: string;
}) => {
    return apiFetch("/admin/config/slider-presign", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getSliderPresign = async (payload: {
    fileName: string;
    contentType: string;
}) => {
    return apiFetch("/admin/config/slider-presign", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};