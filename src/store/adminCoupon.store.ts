import { create } from "zustand";
import { couponApi } from "../services/coupon.api";
import type {
    Coupon,
    CreateCouponRequest,
} from "../services/coupon.api";

interface AdminCouponStore {
    coupons: Coupon[];
    loading: boolean;
    fetchCoupons: () => Promise<void>;
    createCoupon: (payload: CreateCouponRequest) => Promise<void>;
    deleteCoupon: (couponCode: string) => Promise<void>;
}

export const useAdminCouponStore = create<AdminCouponStore>((set, get) => ({
    coupons: [],
    loading: false,
    fetchCoupons: async () => {
        set({ loading: true });

        try {
            const coupons = await couponApi.getCoupons();
            set({ coupons });
        } finally {
            set({ loading: false });
        }
    },

    createCoupon: async (payload) => {
        await couponApi.createCoupon(payload);

        await get().fetchCoupons();
    },

    deleteCoupon: async (couponCode) => {
        await couponApi.deleteCoupon(couponCode);

        set({
            coupons: get().coupons.filter(
                (c) => c.couponCode !== couponCode
            ),
        });
    },
}));