import { create } from "zustand";
import { apiFetch } from "../services/api";

type ProfileData = {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletCredit?: number;
    referralCode?: string;
};

interface ProfileState {
    profile: ProfileData | null;
    loading: boolean;
    loadProfile: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: JSON.parse(localStorage.getItem("profile") || "null"),
    loading: false,

    loadProfile: async () => {
        if (get().profile) return;
        set({ loading: true });
        try {
            const res = await apiFetch("/user/profile");

            set({ profile: res.data });
            localStorage.setItem("profile", JSON.stringify(res.data));
        } finally {
            set({ loading: false });
        }
    },
    refreshProfile: async () => {
        set({ loading: true });

        try {
            const res = await apiFetch("/user/profile");

            set({ profile: res.data });
            localStorage.setItem("profile", JSON.stringify(res.data));
        } finally {
            set({ loading: false });
        }
    },
    clearProfile: () => {
        set({ profile: null });
        localStorage.removeItem("profile");
    },
}));