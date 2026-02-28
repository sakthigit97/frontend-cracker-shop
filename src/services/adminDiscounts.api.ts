import { apiFetch } from "./api";

export const listDiscounts = async () => {
    return apiFetch("/admin/discounts");
};

export const createDiscount = async (payload: any) => {
    return apiFetch("/admin/discounts", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getDiscountById = async (discountId: string) => {
    return apiFetch(`/admin/discounts/${discountId}`);
};

export const updateDiscount = async (discountId: string, payload: any) => {
    return apiFetch(`/admin/discounts/${discountId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const listAdminCategories = async () => {
    return apiFetch("/admin/categories");
};

export const listAdminBrands = async () => {
    return apiFetch("/admin/brands");
};

export const listAdminProducts = async () => {
    return apiFetch("/admin/products");
};