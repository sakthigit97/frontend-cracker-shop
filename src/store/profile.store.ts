import { create } from "zustand";
import { apiFetch } from "../services/api";

type ProfileData = {
    title: "Mr" | "Mrs" | "Ms";
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletCredit?: number;
    referralCode?: string;
    isBulkUser?: boolean;
    chitBalance?: number;
    myReferredPeople?: { name: string; mobile: string }[];
};

interface ProfileState {
    profile: ProfileData | null;
    loading: boolean;
    loadProfile: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    clearProfile: () => void;
}

const CACHE_KEY = "profile";
const safeParse = (value: string | null): ProfileData | null => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};
let profileLoadedThisSession = false;
export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: safeParse(localStorage.getItem(CACHE_KEY)),
    loading: false,

    loadProfile: async () => {
        if (profileLoadedThisSession) {
            return;
        }

        if (get().loading) {
            return;
        }

        profileLoadedThisSession = true;

        set({ loading: true });

        try {
            const res = await apiFetch("/user/profile");

            set({ profile: res.data });

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(res.data)
            );
        } catch (err) {
            profileLoadedThisSession = false;
            console.error("Profile load failed", err);
        } finally {
            set({ loading: false });
        }
    },
    refreshProfile: async () => {
        if (get().loading) return;

        set({ loading: true });

        try {
            const res = await apiFetch("/user/profile");

            set({ profile: res.data });

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(res.data)
            );
        } catch (err) {
            console.error("Profile refresh failed", err);
        } finally {
            set({ loading: false });
        }
    },
    clearProfile: () => {
        set({ profile: null });
        localStorage.removeItem(CACHE_KEY);
    },
}));

if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === CACHE_KEY) {
            try {
                const updated = e.newValue ? JSON.parse(e.newValue) : null;
                useProfileStore.setState({ profile: updated });
            } catch {
                useProfileStore.setState({ profile: null });
            }
        }
    });
}