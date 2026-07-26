import { apiFetch } from "../services/api";

export interface Coupon {
    couponCode: string;
    description?: string;
    type: "FLAT" | "PERCENTAGE";
    value: number;
    expiryDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ValidateCouponResponse {
    couponCode: string;
    couponType: "FLAT" | "PERCENTAGE";
    couponValue: number;
    couponDiscount: number;
    payable: number;
}

export interface CreateCouponRequest {
    couponCode: string;
    description?: string;
    type: "FLAT" | "PERCENTAGE";
    value: number;
    expiryDate: string;
}

export const couponApi = {

    async getCoupons(): Promise<Coupon[]> {
        const res = await apiFetch('/admin/coupons');
        return res.data;
    },

    async createCoupon(payload: CreateCouponRequest): Promise<Coupon> {
        const data = await apiFetch("/admin/coupons", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return data.data;
    },

    async deleteCoupon(couponCode: string): Promise<void> {
        await apiFetch(`/admin/coupons/${couponCode}`, {
            method: "DELETE",
        });
    },

};

export async function validateCoupon(
    couponCode: string,
    subtotal: number
): Promise<ValidateCouponResponse> {
    const res = await apiFetch("/coupon/validate", {
        method: "POST",
        body: JSON.stringify({
            couponCode,
            subtotal,
        }),
    });
    return res.data;
}